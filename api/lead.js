// Приймає заявку з форми на сайті й надсилає її в Telegram.
// Токен і ID чату зберігаються в налаштуваннях Vercel, а не в коді:
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

const clean = (value, limit) => String(value ?? '').trim().slice(0, limit);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('TELEGRAM_BOT_TOKEN або TELEGRAM_CHAT_ID не задано');
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: 'bad_request' });
    }
  }
  body = body || {};

  // Приховане поле: людина його не бачить, а спам-боти заповнюють.
  if (clean(body.website, 200)) {
    return res.status(200).json({ ok: true });
  }

  const name = clean(body.name, 100);
  const contact = clean(body.contact, 100);
  const age = clean(body.age, 20);
  const request = clean(body.request, 1000);

  if (!name || !contact) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  const text = [
    'Нова заявка з сайту',
    '',
    `Ім’я: ${name}`,
    `Контакт: ${contact}`,
    `Вік дитини: ${age || 'не вказано'}`,
    `Запит: ${request || 'не вказано'}`,
  ].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!response.ok) {
      console.error('Telegram повернув помилку', response.status);
      return res.status(502).json({ ok: false, error: 'telegram_error' });
    }
  } catch {
    console.error('Не вдалося зв’язатися з Telegram');
    return res.status(502).json({ ok: false, error: 'telegram_unreachable' });
  }

  return res.status(200).json({ ok: true });
};
