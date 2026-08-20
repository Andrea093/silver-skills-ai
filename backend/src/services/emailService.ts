import { env, isEmailEnabled } from "../lib/env";

// Uses Resend's plain REST API directly (fetch), same convention the rest of the codebase already
// follows for external services (Adzuna/Jooble/SPE in jobAggregator.ts) instead of pulling in an
// SDK for a single POST call.
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  if (!isEmailEnabled()) {
    // No RESEND_API_KEY configured — the reset token still gets created server-side (so nothing
    // about the request flow breaks), it just never reaches an inbox. Logged for whoever has
    // access to production logs to notice, but never surfaced to the end user (same reasoning as
    // hiding the Mentor IA fallback-mode banner: an internal config gap isn't the user's problem).
    console.warn(`[email] RESEND_API_KEY no configurada — no se envió el correo de recuperación a ${to}. Enlace: ${resetUrl}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.resendFromEmail,
        to: [to],
        subject: "Recupera tu contraseña — Silver Skills AI",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #16283f;">
            <h2 style="margin-bottom: 8px;">Recupera tu contraseña</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Silver Skills AI.</p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}" style="background: #1d3657; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Crear nueva contraseña
              </a>
            </p>
            <p style="font-size: 13px; color: #5480ad;">Este enlace es válido por 1 hora. Si tú no pediste este cambio, puedes ignorar este correo — tu contraseña actual sigue funcionando.</p>
          </div>
        `,
      }),
    });
    if (!res.ok) {
      console.error(`[email] Resend respondió ${res.status} al enviar a ${to}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Error enviando correo de recuperación:", err);
    return false;
  }
}
