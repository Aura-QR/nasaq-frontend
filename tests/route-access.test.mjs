/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { transformSync } from 'esbuild';
import { matchRoutes } from 'react-router-dom';
import { teacherPreparationRedirect } from '../src/shared/navigation/preparationRoutes.js';

const require = createRequire(import.meta.url);
const guardSource = readFileSync(new URL('../src/shared/guards/ModuleAccessRoute.jsx', import.meta.url), 'utf8');
const compiled = transformSync(guardSource, { loader: 'jsx', jsx: 'automatic', format: 'cjs',
  define: { 'import.meta.env.DEV': 'false' } }).code;
function guard(role, module, pathname, permissions = [], extraLocation = {}) {
  const moduleObject = { exports: {} };
  const sandbox = vm.createContext({ module: moduleObject, exports: moduleObject.exports,
    localStorage: { getItem: () => null }, require: (name) => {
      if (name === 'react-router-dom') return { Navigate: 'Navigate', Outlet: 'Outlet',
        useLocation: () => ({ pathname, search: '', hash: '', ...extraLocation }) };
      if (name === 'react-auth-kit') return { useAuthUser: () => () => ({ role, permissions }) };
      if (name === '@/shared/auth/permissions') return { getStoredPermissions: () => [] };
      if (name === '@/shared/navigation/preparationRoutes') return { teacherPreparationRedirect };
      return require(name);
    } });
  vm.runInContext(compiled, sandbox);
  return moduleObject.exports.default({ module });
}

test('old teacher preparation links redirect to the correct portal with query and hash preserved', () => {
  for (const [suffix, target] of [['', ''], ['/add', '/add'], ['/abc123', '/abc123'], ['/edit/abc123', '/edit/abc123']]) {
    const result = guard('TEACHER', 'preparation', `/school/preparation${suffix}`, [], { search: '?weekOf=2026-09-09', hash: '#content' });
    assert.equal(result.type, 'Navigate');
    assert.equal(result.props.to.pathname, `/teacher/preparations${target}`);
    assert.equal(result.props.to.search, '?weekOf=2026-09-09');
    assert.equal(result.props.to.hash, '#content');
    assert.equal(result.props.replace, true);
  }
});
test('teacher redirect cannot grant access to school administration even with wildcard permissions', () => {
  for (const [module, path] of [['students', '/users/students'], ['financial', '/financial/records'],
    ['classes', '/school/classes'], ['preparation', '/school/preparation/edit/id/unknown']]) {
    const result = guard('TEACHER', module, path, ['*']);
    assert.equal(result.type, 'Navigate'); assert.equal(result.props.to, '/no-access');
  }
});
test('students and platform admins do not acquire teacher or school preparation access', () => {
  for (const role of ['STUDENT', 'SUPER_ADMIN', '']) {
    assert.equal(guard(role, 'preparation', '/school/preparation/edit/abc', ['*']).props.to, '/no-access');
  }
});
test('school admin routes keep their existing permission requirements', () => {
  assert.equal(guard('OWNER', 'preparation', '/school/preparation').type, 'Outlet');
  assert.equal(guard('SUPERVISOR', 'preparation', '/school/preparation').type, 'Outlet');
  assert.equal(guard('MANAGER', 'preparation', '/school/preparation/edit/abc', []).props.to, '/no-access');
  assert.equal(guard('MANAGER', 'preparation', '/school/preparation/edit/abc', ['school.preparation.update']).type, 'Outlet');
});
test('all teacher sidebar links resolve to declared teacher routes', () => {
  const sidebar = readFileSync(new URL('../src/components/Sidebar/Sidebar.jsx', import.meta.url), 'utf8');
  const teacherSection = sidebar.slice(sidebar.indexOf('    if (isTeacher) {'), sidebar.indexOf('    return baseCategories;'));
  const destinations = [...teacherSection.matchAll(/to:\s*"([^"]+)"/g)].map((match) => match[1]);
  const router = readFileSync(new URL('../src/app/AppRouter.jsx', import.meta.url), 'utf8');
  const teacherRoutes = [...router.matchAll(/path="(\/teacher[^"]*)"/g)].map((match) => ({ path: match[1] }));
  assert.ok(destinations.length > 0);
  for (const destination of destinations) {
    assert.ok(destination.startsWith('/teacher/'), destination);
    assert.ok(matchRoutes(teacherRoutes, destination), destination);
  }
  for (const alias of ['/teacher/students', '/teacher/lectures']) assert.ok(matchRoutes(teacherRoutes, alias));
  for (const path of ['/school/preparation', '/school/preparation/add', '/school/preparation/edit/abc', '/school/preparation/abc']) {
    assert.ok(matchRoutes(teacherRoutes, teacherPreparationRedirect(path)), path);
  }
});

test('quick prep privacy policy is a public route outside authentication guards', () => {
  const router = readFileSync(new URL('../src/app/AppRouter.jsx', import.meta.url), 'utf8');
  const privacyRoute = router.indexOf('path="/privacy/quick-prep"');
  const authenticatedRoutes = router.indexOf('<AuthenticatedRoute');
  assert.ok(privacyRoute >= 0, 'privacy route is missing');
  assert.ok(authenticatedRoutes >= 0, 'authenticated route group is missing');
  assert.ok(privacyRoute < authenticatedRoutes, 'privacy route must remain public');
});
