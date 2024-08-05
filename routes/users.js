var express = require("express");
var router = express.Router();

// PUT /user/ ⇒ Permet de mettre à jour les infos de User

require("../models/connection");
const User = require("../models/user");
const { checkBody } = require("../module/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

router.get("/", (req, res) => {
  User.find({}).then((data) => {
    res.json({ result: true, users: data });
  });
});

router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["email", "mobile", "motDePasse"])) {
    res.json({ result: false, error: "Champs manquants" });
    return;
  }
  User.findOne({ email: req.body.email }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.motDePasse, 10);

      const newUser = new User({
        email: req.body.email,
        mobile: req.body.mobile,
        motDePasse: hash,
        mesRDV: [],
        formule: null,
        moyenPaiement: [],
        salonLike: [],
        token: uid2(32),
      });
      newUser.save().then((newDoc) => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      res.json({ result: false, error: "Utilisateur déjà existant" });
    }
  });
});

router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "mot de passe"])) {
    res.json({ result: false, error: "Champs manquants" });
    return;
  }
  User.findOne({ email: req.body.email }).then((data) => {
    if (data && bcrypt.compareSync(req.body.motDePasse, data.motDePasse)) {
      res.json({ result: true, token: data.token });
    } else {
      res.json({
        result: false,
        error: "Utilisateur inconnu ou mot de passe érroné",
      });
    }
  });
});

router.delete("/", (req, res) => {
  if (!checkBody(req.body)) {
    res.json({ result: false, error: "Champs manquants" });
    return;
  }
  User.deleteOne({ email: req.body.email }).then(() => {
    res.json({ result: true });
  });
});

router.delete("/myCard", (req, res) => {
  if (
    !checkBody(req.body, [
      "numCarte",
      "dateExpirationMois",
      "dateExpirationAnnee",
      "CVC",
    ])
  ) {
    res.json({ result: false, error: "Aucun moyen de paiement ajouté" });
    return;
  }
  User.deleteOne({ moyenPaiement: req.body }).then(() => {
    res.json({ result: true });
  });
});

router.post("/myCard", (req, res) => {
  if (
    !checkBody(req.body, [
      "numCarte",
      "dateExpirationMois",
      "dateExpirationAnnee",
      "CVC",
    ])
  ) {
    res.json({ result: false, error: "Aucun moyen de paiement ajouté" });
    return;
  }
  User.findOne({ moyenPaiement: req.body.moyenPaiement }).then((data) => {
    if (data === null) {
      const newCard = new Card({
        numCarte: req.body.numCarte,
        dateExpirationMois: req.body.dateExpirationMois,
        dateExpirationAnnee: req.body.dateExpirationAnnee,
        CVC: req.body.CVC,
      });
      newCard.save().then(() => {
        res.json({ result: true });
      });
    } else {
      res.json({ result: false, error: "Carte déjà existante" });
    }
  });
});

router.put("/", (req, res) => {
  User.updateOne(
    { token: req.body.token },
    { $set: { formules: req.body._ObjectId } }
  ).then((data) => {
    if (data) {
      User.findOne({ token: req.body.token })
        .populate("formule")
        .then(res.json({ result: true }));
    } else {
      res.json({
        result: false,
        error: "Aucune modification effectuée",
      });
    }
  });
});

router.put("/formule/delete", (req, res) => {
  User.updateOne(
    { token: req.body.token },
    { $pull: { formule: req.body.formule } }
  ).then((data) => {
    if (!data.formule) {
      res.json({ result: true });
    } else {
      res.json({
        result: false,
        error: "Aucun compte trouvé",
      });
    }
  });
});


router.put('/formule', (req,res) => {
  let formuleExisting;
  User.findOne({token: req.body.token}).populate('formule')
  .then(data => {
    if(data){
      formuleExisting = data.formule._ObjectId;
      User.updateOne({token: req.body.token}, {$pull: {formule: formuleExisting}})
      .then(()=>{
        User.updateOne({token: req.body.token}, {$push: {formule: req.body._ObjectId}})
        .then(res.json({result : true}));
      })
    } else {
      res.json({result: false});
    }
  });
})

module.exports = router;
