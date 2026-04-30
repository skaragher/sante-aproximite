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

  if (err?.status && err?.message) {
    return res.status(err.status).json({
      message: err.message
    });
  }

  return res.status(500).json({
    message: "Erreur interne du serveur"
  });
}
