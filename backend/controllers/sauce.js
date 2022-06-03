const Sauce = require('../models/Sauce');
const fs = require('fs');

// Récupère l'intégralité des sauces
exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => { res.status(200).json(sauces) })
    .catch((error) => { res.status(400).json({ error: error }) });
};

// Récupère une sauce précise 
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

// Créer une nouvelle sauce
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  });
  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce enregistrée !' }))
    .catch(error => res.status(400).json({ error }));
};

// Modifie une sauce
exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ?
    {
      ...JSON.parse(req.body.sauce), imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    }
    :
    {
      ...req.body
    };
  // Modification de la sauce si vérif de l'id utilisateur et id sauce sont ok,sinon envoi d'une erreur code 403
  Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
    .catch(error => res.status(403).json({ error: error, message: 'Requête non autorisée' }));
};

// Supprime une sauce
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Sauce supprimée !' }))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

// Like ou dislike une sauce
exports.likeOrDislikeSauce = (req, res, next) => {
  let sauceId = req.params.id
  let userId = req.body.userId
  let like = req.body.like
  // Récupération de l'id de la sauce séléctionnée
  Sauce.findOne({ _id: sauceId })
    .then((sauce) => {
      // Ajoute un like
      if (like === 1 && !sauce.usersLiked.includes(userId)) {
        Sauce.updateOne({ _id: sauceId },
          {
            // Incrémentation des likes et push dans tableau des usersLiked via opérateur mongoose $inc et $push
            $inc: { likes: like++ },
            $push: { usersLiked: userId },
          })
          .then(() => res.status(200).json({ message: 'Like ajouté !' }))
          .catch(error => res.status(400).json({ error }))
      }
      // Ajoute un dislike
      if (like === -1 && !sauce.usersDisliked.includes(userId)) {
        Sauce.updateOne({ _id: sauceId },
          {
            $inc: { dislikes: like * -1 },
            $push: { usersDisliked: userId },
          })
          .then(() => res.status(200).json({ message: 'Dislike ajouté !' }))
          .catch(error => res.status(400).json({ error }))
      }
      // Enlève un like
      if (like === 0 && sauce.usersLiked.includes(userId)) {
        Sauce.updateOne({ _id: sauceId },
          {
            $inc: { likes: - 1 },
            $pull: { usersLiked: userId },
          }
        )
          .then(() => res.status(201).json({ message: 'Like annulé !' }))
          .catch((error) => res.status(400).json({ error }));
      }
      // Enlève un dislike 
      if (sauce.usersDisliked.includes(userId)) {
        Sauce.updateOne({ _id: sauceId },
          {
            $inc: { dislikes: -1 },
            $pull: { usersDisliked: userId },
          }
        )
          .then(() => res.status(201).json({ message: 'Dislike annulé !' }))
          .catch((error) => res.status(400).json({ error }));
      }
    })
    .catch((error) => res.status(400).json({ error }));
};