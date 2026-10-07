export function submitPayfast(checkout) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkout.actionUrl;
  Object.entries(checkout.fields || {}).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value == null ? '' : String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}
