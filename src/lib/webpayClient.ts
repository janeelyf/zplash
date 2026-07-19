// Webpay Plus exige un POST con token_ws al `url` que devuelve /api/pagos/webpay/crear,
// no un simple redirect GET — se arma un form invisible y se autoenvía.
export function redirigirAWebpay(url: string, token: string): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "token_ws";
  input.value = token;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}
