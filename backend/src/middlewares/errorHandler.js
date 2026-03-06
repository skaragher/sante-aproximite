export function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      message: "Fichier trop volumineux. Importez en lots."
    });
  }

  return res.status(500).json({
    message: "Erreur interne du serveur"
  });
}
