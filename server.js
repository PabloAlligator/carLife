import express from 'express';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MIN_FORM_TIME_MS = 2500;

const requiredEnv = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'TO_EMAIL',
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length) {
  console.error(`Отсутствуют переменные окружения: ${missingEnv.join(', ')}`);
  process.exit(1);
}

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.static(__dirname));

const sendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Слишком много заявок. Попробуйте чуть позже.',
  },
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CarLife server is running',
  });
});

app.post('/api/send', sendLimiter, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Некорректный запрос.',
      });
    }

    if (req.body.website) {
      return res.status(400).json({
        success: false,
        message: 'Некорректная заявка.',
      });
    }

    const formTime = Number(req.body.form_time || 0);

    if (!formTime || Date.now() - formTime < MIN_FORM_TIME_MS) {
      return res.status(400).json({
        success: false,
        message: 'Попробуйте отправить форму чуть позже.',
      });
    }

    const name = cleanText(req.body.name, 60);
    const phone = cleanText(req.body.phone, 40);
    const service = cleanText(req.body.service, 80);
    const message = cleanText(req.body.message, 900);
    const page = cleanText(req.body.page, 200);

    if (!name || name.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Введите корректное имя.',
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Введите корректный номер телефона.',
      });
    }

    if (!service) {
      return res.status(400).json({
        success: false,
        message: 'Выберите услугу.',
      });
    }

    const formattedPhone = formatPhone(phone);
    const telLink = makeTelLink(phone);

    const createdAt = new Date().toLocaleString('ru-RU', {
      timeZone: 'Asia/Krasnoyarsk',
    });

    console.log('🔥 Новая заявка CarLife:', {
      name,
      phone: formattedPhone,
      service,
      page: page || '—',
      createdAt,
      ip: req.ip,
    });

    const text = `
Новая заявка с сайта CarLife

Имя: ${name}
Телефон: ${formattedPhone}
Услуга: ${service}
Комментарий: ${message || '—'}
Страница: ${page || '—'}
Дата заявки: ${createdAt}
    `.trim();

    const html = buildEmailTemplate({
      name,
      formattedPhone,
      telLink,
      service,
      message,
      page,
      createdAt,
    });

    const sendMailPromise = transporter.sendMail({
      from: `"CarLife сайт" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL,
      subject: `Заявка CarLife: ${service}`,
      text,
      html,
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('SMTP timeout')), 10000);
    });

    await Promise.race([sendMailPromise, timeoutPromise]);

    return res.status(200).json({
      success: true,
      message: 'Заявка отправлена. Мы скоро свяжемся с вами.',
    });
  } catch (error) {
    console.error('Ошибка отправки заявки CarLife:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера. Попробуйте ещё раз чуть позже.',
    });
  }
});

transporter.verify((error) => {
  if (error) {
    console.error('Ошибка подключения к SMTP CarLife:', error.message);
  } else {
    console.log('SMTP CarLife готов к отправке писем');
  }
});

app.listen(PORT, () => {
  console.log(`CarLife server started: http://localhost:${PORT}`);
});

function cleanText(value, maxLength = 500) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith('7')) return digits;
  if (digits.length === 10) return `7${digits}`;

  return '';
}

function isValidPhone(phone) {
  return /^7\d{10}$/.test(normalizePhone(phone));
}

function formatPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return '';

  return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(
    4,
    7,
  )}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
}

function makeTelLink(phone) {
  const normalized = normalizePhone(phone);
  return normalized ? `tel:+${normalized}` : '#';
}

function buildEmailTemplate({
  name,
  formattedPhone,
  telLink,
  service,
  message,
  page,
  createdAt,
}) {
  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(formattedPhone);
  const safeTelLink = escapeHtml(telLink);
  const safeService = escapeHtml(service);
  const safeMessage = escapeHtml(message || '—');
  const safePage = escapeHtml(page || '—');
  const safeCreatedAt = escapeHtml(createdAt);

  return `
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Новая заявка CarLife</title>
  </head>
  <body style="margin:0;padding:0;background:#0f0f10;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f10;padding:24px 12px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#171719;border-radius:22px;overflow:hidden;border:1px solid #2a2a2d;">
            <tr>
              <td style="padding:28px;background:linear-gradient(135deg,#111111,#262626);">
                <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#c9a45c;margin-bottom:10px;">
                  CarLife · новая заявка
                </div>
                <h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;">
                  Запись на автосервис
                </h1>
                <p style="margin:12px 0 0;color:#cfcfcf;font-size:15px;line-height:1.5;">
                  Клиент оставил заявку на сайте CarLife.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:26px;">
                ${emailRow('Имя', safeName)}
                ${emailRow('Телефон', `<a href="${safeTelLink}" style="color:#c9a45c;text-decoration:none;font-weight:700;">${safePhone}</a>`)}
                ${emailRow('Услуга', safeService)}
                ${emailRow('Комментарий', safeMessage)}
                ${emailRow('Страница', safePage)}
                ${emailRow('Дата заявки', safeCreatedAt)}

                <div style="margin-top:26px;padding:18px;border-radius:16px;background:#101011;border:1px solid #2b2b2e;">
                  <p style="margin:0 0 10px;color:#ffffff;font-size:16px;font-weight:700;">
                    Что сделать дальше
                  </p>
                  <p style="margin:0;color:#cfcfcf;font-size:14px;line-height:1.6;">
                    Позвонить клиенту, уточнить автомобиль, проблему, удобное время записи и подтвердить визит в сервис.
                  </p>
                </div>

                <div style="margin-top:24px;text-align:center;">
                  <a href="${safeTelLink}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#c9a45c;color:#111111;text-decoration:none;font-weight:700;">
                    Позвонить клиенту
                  </a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 26px;background:#111112;border-top:1px solid #2a2a2d;color:#888;font-size:12px;line-height:1.5;">
                Это письмо отправлено автоматически с формы сайта carlife-abakan.ru.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

function emailRow(label, value) {
  return `
    <div style="padding:14px 0;border-bottom:1px solid #2a2a2d;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.4px;color:#888;margin-bottom:6px;">
        ${label}
      </div>
      <div style="font-size:16px;line-height:1.5;color:#ffffff;">
        ${value || '—'}
      </div>
    </div>
  `;
}
