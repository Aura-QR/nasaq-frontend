export const registerRequest = async (payload) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/auth/register`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        status: false,
        message:
          data?.message ||
          "تعذر إنشاء الحساب",
      };
    }

    return {
      status: true,
      data,
    };
  } catch (error) {
    console.error("Register error:", error);

    return {
      status: false,
      message:
        "تعذر الاتصال بالخادم، حاول مرة أخرى",
    };
  }
};