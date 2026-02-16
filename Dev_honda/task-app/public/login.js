const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const handleAuth = async (url, form) => {
  const data = new FormData(form);
  const payload = {
    username: data.get("username"),
    password: data.get("password")
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    alert("認証に失敗しました");
    return;
  }
  if (url.includes("login")) {
    const json = await res.json();
    setToken(json.token);
    window.location.href = "/teams.html";
    return;
  }
  alert("登録しました。ログインしてください。");
  form.reset();
};

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleAuth("/api/auth/login", loginForm);
});

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleAuth("/api/auth/register", registerForm);
});
