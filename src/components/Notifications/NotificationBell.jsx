import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { NotificationsRounded } from "@mui/icons-material";

import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/APIs/school/notifications";

/** كل دقيقة. مفيش push، فالاستطلاع هو الوسيلة الوحيدة. */
const POLL_MS = 60_000;

/**
 * جرس الإشعارات.
 *
 * من غيره الميزة كلها فيها ثغرة: المديرة تكلّف بديل الصبح، والبديل مش هيعرف
 * لأنه مش هيفتح شاشة هو مش مستنيها — والفصل يفضل فاضي.
 */
const NotificationBell = ({ sx }) => {
  const [anchor, setAnchor] = useState(null);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    const response = await fetchUnreadCount();
    if (response.status) setUnread(response.data?.unread ?? 0);
  }, []);

  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  const open = async (event) => {
    setAnchor(event.currentTarget);
    setLoading(true);

    const response = await fetchNotifications({ limit: 30 });
    if (response.status) {
      setItems(response.data?.items ?? []);
      // اللستة بترجّع العدد جوّاها، فمفيش نداء تاني.
      setUnread(response.data?.unread ?? 0);
    }

    setLoading(false);
  };

  const readOne = async (item) => {
    if (item.read) return;

    // تفاؤلي: الرقم بينزل فورًا، والسيرفر بيتظبط بعدها.
    setItems((previous) =>
      previous.map((row) =>
        row._id === item._id ? { ...row, read: true } : row
      )
    );
    setUnread((previous) => Math.max(0, previous - 1));

    const response = await markNotificationRead(item._id);
    if (!response.status) refreshCount();
  };

  const readAll = async () => {
    setItems((previous) => previous.map((row) => ({ ...row, read: true })));
    setUnread(0);

    const response = await markAllNotificationsRead();
    if (!response.status) refreshCount();
  };

  return (
    <>
      <Tooltip title="الإشعارات">
        <IconButton
          onClick={open}
          aria-label="الإشعارات"
          sx={{ width: 40, height: 40, color: "#244a70", ...sx }}
        >
          <Badge badgeContent={unread} color="error" max={99}>
            <NotificationsRounded />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 460, borderRadius: 2 } } }}
      >
        <Box dir="rtl">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2, py: 1.5 }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              الإشعارات
            </Typography>
            {unread > 0 && (
              <Button size="small" onClick={readAll}>
                تعليم الكل كمقروء
              </Button>
            )}
          </Stack>
          <Divider />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : items.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 2, py: 4, textAlign: "center" }}
            >
              مفيش إشعارات.
            </Typography>
          ) : (
            <List dense disablePadding>
              {items.map((item) => (
                <ListItemButton
                  key={item._id}
                  onClick={() => readOne(item)}
                  sx={{
                    alignItems: "flex-start",
                    bgcolor: item.read ? "transparent" : "rgba(36,74,112,0.06)",
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        fontWeight={item.read ? 400 : 700}
                      >
                        {item.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {item.body}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
