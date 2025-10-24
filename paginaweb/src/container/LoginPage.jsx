import React from "react";
import { useAuth } from "../components/Auth";
import heroImage from "@logos/bienestar_optica.jpg";

function LoginPage() {
  const auth = useAuth();
  const [formValues, setFormValues] = React.useState({
    username: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formValues.username.trim()) return;

    setIsSubmitting(true);
    auth.login({ username: formValues.username.trim() });
    setTimeout(() => {
      setIsSubmitting(false);
    }, 400);
  };

  const isDisabled = isSubmitting || !formValues.username.trim();

  return (
    <section className="login-page">
      <div className="login-card">
        <div className="login-hero">
          <div className="login-pill">Bienestar Óptica</div>
          <h1>
            Accede a la plataforma y gestiona tu{" "}
            <span>experiencia visual</span>
          </h1>
          <p>
            Mantén el control de tus citas, seguimientos y beneficios exclusivos
            desde un mismo lugar.
          </p>
          <ul className="login-benefits">
            <li>Agenda inteligente de controles</li>
            <li>Historial clínico centralizado</li>
            <li>Ofertas y brigadas personalizadas</li>
          </ul>
          <img
            className="login-hero__image"
            src={heroImage}
            alt="Especialista de Bienestar Óptica atendiendo a un paciente"
            loading="lazy"
          />
        </div>

        <div className="login-form__wrapper">
          <div className="login-form__header">
            <p className="eyebrow">Ingreso seguro</p>
            <h2>Inicia sesión</h2>
            <p className="subtitle">
              Usa tu cuenta de Bienestar Óptica para continuar.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Usuario</span>
              <input
                type="text"
                name="username"
                autoComplete="username"
                placeholder="correo@bienestaroptica.com"
                value={formValues.username}
                onChange={handleChange}
                required
              />
            </label>

            <label className="form-field">
              <span>Contraseña</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={formValues.password}
                onChange={handleChange}
              />
            </label>

            <div className="login-form__actions">
              <label className="remember">
                <input type="checkbox" defaultChecked />
                <span>Recordar mi sesión</span>
              </label>
              <button type="button" className="ghost-button">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" className="btn-primary" disabled={isDisabled}>
              {isSubmitting ? "Ingresando..." : "Ingresar"}
            </button>

            <p className="login-help">
              ¿Necesitas ayuda? Escríbenos a{" "}
              <a href="mailto:soporte@bienestaroptica.com">
                soporte@bienestaroptica.com
              </a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
