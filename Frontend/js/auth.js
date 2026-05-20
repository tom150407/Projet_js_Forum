document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        username: document.getElementById("reg-username").value,
        email: document.getElementById("reg-email").value,
        password: document.getElementById("reg-password").value,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      document.getElementById("register-message").textContent = res.ok
        ? "✅ " + data.message
        : "❌ " + data.error;
      if (res.ok) registerForm.reset();
    });
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        identifier: document.getElementById("log-identifier").value,
        password: document.getElementById("log-password").value,
      };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      document.getElementById("login-message").textContent = res.ok
        ? "✅ " + data.message
        : "❌ " + data.error;

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setTimeout(() => (window.location.href = "/"), 1000);
      }
    });
  }
});
