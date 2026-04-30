import { sendMailToYefa } from "../services/mailService.js";

function pickUserLabel(req) {
  return req.user?.fullName || req.user?.email || "Utilisateur mobile";
}

export async function contactDeveloper(req, res, next) {
  try {
    const { subject, message, phoneNumber } = req.body || {};
    const userEmail = req.user?.email || "";
    const senderName = pickUserLabel(req);

    if (!subject || !String(subject).trim() || !message || !String(message).trim()) {
      return res.status(400).json({ message: "Le sujet et le message sont obligatoires." });
    }

    await sendMailToYefa({
      subject: `Contact developpeur - ${String(subject).trim()}`,
      lines: [
        `${senderName} a envoye un message depuis l'application mobile.`,
        "",
        String(message).trim(),
      ],
      metadata: {
        nom: senderName,
        email: userEmail,
        telephone: phoneNumber || req.user?.phoneNumber || "",
        origine: "Application mobile - bouton jaune",
      },
    });

    return res.json({ ok: true, message: "Votre message a ete envoye au developpeur." });
  } catch (error) {
    return next(error);
  }
}

export async function submitDigitalProject(req, res, next) {
  try {
    const {
      fullName,
      email,
      whatsapp,
      sector,
      otherSector,
      need,
      otherNeed,
      deadline,
      message,
    } = req.body || {};

    if (!fullName || !email || !sector || !need || !deadline) {
      return res.status(400).json({
        message: "Nom, email, secteur, besoin et delai sont obligatoires.",
      });
    }

    await sendMailToYefa({
      subject: `Projet de digitalisation - ${String(fullName).trim()}`,
      lines: [
        `${String(fullName).trim()} souhaite lancer un projet de digitalisation.`,
        message ? `Message: ${String(message).trim()}` : "Aucun message complementaire.",
      ],
      metadata: {
        nom: fullName,
        email,
        whatsapp: whatsapp || "",
        secteur: otherSector ? `${sector} - ${otherSector}` : sector,
        besoin: otherNeed ? `${need} - ${otherNeed}` : need,
        delai: deadline,
        origine: "Application mobile - bouton rouge",
      },
    });

    return res.json({ ok: true, message: "Votre projet a ete envoye a YEFA Technologie." });
  } catch (error) {
    return next(error);
  }
}
