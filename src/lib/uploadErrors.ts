// Message lisible pour un échec d'envoi d'un fichier audio. Fonction pure (testée avec
// `npm test`). Le stockage et l'API répondent en anglais technique ; on garde le
// message de l'API quand il est déjà clair (« This file doesn't look like audio… »).

export function friendlyUploadError(raw: unknown): string {
  const message = raw instanceof Error ? raw.message : typeof raw === "string" ? raw : "";
  if (/exceeded the maximum allowed size|payload too large|request entity too large|\b413\b/i.test(message)) {
    return "This file is larger than the upload limit. Try a smaller file, for example an MP3 or a FLAC.";
  }
  if (/mime type|content[- ]type|unsupported media/i.test(message)) {
    return "This file type isn't accepted. Use an MP3, FLAC, WAV, Ogg or M4A file.";
  }
  if (/failed to fetch|networkerror|network request failed|load failed|timeout/i.test(message)) {
    return "The upload was interrupted. Check your connection and try again.";
  }
  if (/jwt|unauthori[sz]ed|\b401\b|not authenticated/i.test(message)) {
    return "Your session expired. Log in again, then retry.";
  }
  return message.trim() || "The upload failed. Please try again.";
}
