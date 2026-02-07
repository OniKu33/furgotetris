// src/middleware.js

export async function onRequest({ cookies, request, redirect }, next) {
  const url = new URL(request.url);

  // 1. ZONAS LIBRES: Login y recursos estáticos (imágenes, css)
  if (url.pathname === "/login" || url.pathname.startsWith("/_image") || url.pathname.includes("favicon")) {
    return next();
  }

  // 2. COMPROBAR CREDENCIAL (Cookie)
  const roleCookie = cookies.get("furgorole");

  // Si no tiene cookie -> AL LOGIN
  if (!roleCookie) {
    return redirect("/login");
  }

  const role = roleCookie.value;

  // 3. SEGURIDAD DE RANGOS (Protección de rutas)

  // Rutas que SOLO los CHUNIN pueden tocar
  const rutasChunin = ["/inventario", "/manifiesto", "/admin"];

  // Si un GENIN intenta entrar en zona CHUNIN -> A CASA
  if (rutasChunin.some(ruta => url.pathname.startsWith(ruta))) {
    if (role !== 'chunin') {
      // Opción A: Mandarlo a la home
      return redirect("/");
    }
  }

  // Si todo está bien, adelante
  return next();
}