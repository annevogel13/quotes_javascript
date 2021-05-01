/* ******************************************************************
 * Constantes de configuration
 */
const apiKey = "5f8ba44f-1ba2-4d31-91fe-8b4e37a70279";
const serverUrl = "https://lifap5.univ-lyon1.fr";

/* ******************************************************************
 * Gestion des tabs "Voter" et "Toutes les citations"
 ******************************************************************** */



/*eslint max-len: ["error", { "code": 80, "tabWidth": 4 }]*/
/**
 * Affiche/masque les divs "div-duel" et "div-tout"
 * selon le tab indiqué dans l'état courant.
 *
 * @param {Etat} etatCourant l'état courant
 */
function majTab(etatCourant) {
  console.log("CALL majTab");
  const dDuel = document.getElementById("div-duel");
  const dTout = document.getElementById("div-tout");
  const tDuel = document.getElementById("tab-duel");
  const tTout = document.getElementById("tab-tout");


  if (etatCourant.citationChanged) tableaux("table_body");


  if (etatCourant.tab === "duel") {
    dDuel.style.display = "flex";
    tDuel.classList.add("is-active");
    dTout.style.display = "none";
    tTout.classList.remove("is-active");
  } else {
    dTout.style.display = "flex";
    tTout.classList.add("is-active");
    dDuel.style.display = "none";
    tDuel.classList.remove("is-active");
  }

}

/**
 * Mets au besoin à jour l'état courant lors d'un click sur un tab.
 * En cas de mise à jour, déclenche une mise à jour de la page.
 *
 * @param {String} tab le nom du tab qui a été cliqué
 * @param {Etat} etatCourant l'état courant
 */
function clickTab(tab, etatCourant) {
  console.log(`CALL clickTab(${tab},...)`);
  if (etatCourant.tab !== tab) {
    etatCourant.tab = tab;
    majPage(etatCourant);
  }
}

/**
 * Enregistre les fonctions à utiliser lorsque l'on clique
 * sur un des tabs.
 *
 * @param {Etat} etatCourant l'état courant
 */
function registerTabClick(etatCourant) {
  console.log("CALL registerTabClick");
  document.getElementById("tab-duel").onclick = () =>
    clickTab("duel", etatCourant);
  document.getElementById("tab-tout").onclick = () =>
    clickTab("tout", etatCourant);
}

/////////////////////////////////////////////////////////////////////
/////// affichage de l'ensemble des citations du serveur 1 /////////
////////////////////////////////////////////////////////////////////

/**
 * @brief Fait une requête GET authentifiée sur /citations
 * @returns les citations ou une message d'erreur
 */
function fetchTousCitations() {
  return fetch(serverUrl + "/citations", { headers: { "x-api-key": apiKey } })
    .then((response) => response.json())
    .then((jsonData) => {
      if (jsonData.status && Number(jsonData.status) != 200) {
        return { err: jsonData.message };
      }
      return jsonData;
    })
    .catch((erreur) => ({ err: erreur }));
}

/**
 * @brief transforms the data from the fetchCitations in a string which in html is a table 
 * @param {string} idTab 
 * 
 */
function genererTableaux(idTab, data) { // make tableau

  const str = data.map(n => {
    const button = '<button class="detail_button" id="' + Object.values(n)[0] + '" onclick="afficherDetails(\'' + Object.values(n)[0] + '\')">Détails</button>';

    const arr = [n.rang, n.character, n.quote, button];
    return '<tr>' + creerUneLigneDansLeTableau(arr) + '</tr>';
  });

  document.getElementById(idTab).innerHTML = str.join('');

}

/**
 * @brief creates a string with html-code 
 * @param {string} tab 
 * @returns a string with the html-code for a case in a row 
 */
function creerUneLigneDansLeTableau(tab) {
  return tab.map(n => '<th>' + n + '</th>').join('');
}


/**
 * @brief fonction qui gerer le tableau de citations 
 * @param {identifier} idtab : l'id du <table-body> 
 */
function tableaux(idtab, numeroSort, reverse) {
  fetchTousCitations().then((data) => {

    selectRandomImage(data) // affichage des duels 
    const new_data = addClassement(data); // ajoute d'une champs "rang" dans une object pour changer le classement 
    sortColoms(new_data, idtab, numeroSort, reverse); // triee les champs de facon AZ ou ZA 
    inputTirage(new_data, idtab, numeroSort); // si input champs est vide --> tous les citations 

  });

}


/////////////////////////////////////////////////////////////////////
/////////// functions des classements ///////////////////////////////
/////////////////////////////////////////////////////////////////////

function addClassement(data) {
  const new_data = data.map(n => {
    if (n.scores !== undefined) {
      const classement = victoiresAbsolu(n.scores);
      n.rang = classement;
    } else {

      n['rang'] = 0; // pas participe dans une duel donc le rang est neutre ==> 0 
    }
    return n;
  });
  
  const sorted_data = new_data.sort((a, b) => sortAZ(a, b, 7)); // indice de "rang" est 7 
  return sorted_data;
}

/**
 * 
 * @param {object} scores : object sous la forme de { "..." : {id, wins, looses}, "... " etc} 
 * @returns 
 */
function victoiresAbsolu(scores) {

  const winAbsolu = Object.entries(scores).map(n => nbWinAbsolu(n));
  return winAbsolu.reduce(total);

}

/**
 * @brief fonction qui est a utilise dans une reduce() pour faire la somme 
 * @param {integer} total 
 * @param {integer} n 
 * @returns le somme des element dans une array
 */
function total(total, n) {
  return total + n;
}

/**
 * @brief fonction qui retourne le nombre de victoires absolu d'une citation
 * @param {object} n : une object avec les champs {id, wins, looses}
 * @returns le nombre de victoires absolu 
 */
function nbWinAbsolu(n) {
  const win = n[1].wins //Object.values(n[1])[1].wins;
  const looses = n[1].looses// Object.values(n[1])[1].looses;
  const winAbsolu = win - looses;

  return winAbsolu;
}


/////////////////////////////////////////////////////
//////////// trie tableaux /////////////////////////
///////////////////////////////////////////////////
/**
 * 
 * @param {object} data : tous les citations 
 * @param {string} idtab : identifier du tableau (table-body)
 * @param {integer} numeroSort : numero pour indiquer ou on triee
 * @param {boolean} reverse : indiquer si on utilise AZ ou ZA 
 */
function sortColoms(data, idtab, numeroSort, reverse) {
  
  if (reverse) {
    const new_data = data.sort((a, b) => sortAZ(a, b, numeroSort));
    genererTableaux(idtab, new_data);
    changeLeTete(numeroSort, reverse);
    return new_data;
  }

  if (!reverse) {
    const reverse_data = data.sort((a, b) => sortZA(a, b, numeroSort));
    genererTableaux(idtab, reverse_data);
    changeLeTete(numeroSort, reverse);
    return reverse_data;
  }
}

/**
 * @brief fonction qui change les entêtes des colommes (avec symbole)
 * @param {numnber} numeroSort : indique si on est sur le colomme personnage (2) ou citation (1) 
 * @param {bool} reverse : indique le facon de triee (AZ ou ZA)
 */
function changeLeTete(numeroSort, reverse) {
  if (numeroSort == 1) {
    document.getElementById("renverse2").innerText = "Personnage";
    if (reverse == true) {
      document.getElementById("renverse1").setAttribute('onclick', 'tableaux(\'table_body\', 1, false)'); // pour inverse l'ordre de trirage 
      document.getElementById("renverse1").innerText = "Citation ↓ "; // pour changer le symbole 
    } else if (reverse == false) {
      document.getElementById("renverse1").setAttribute('onclick', 'tableaux(\'table_body\', 1, true)'); // pour inverse l'ordre de trirage 
      document.getElementById("renverse1").innerText = "Citation  ↑ "; //pour changer le symbole
    }
  } else if (numeroSort == 2) {
    document.getElementById("renverse1").innerText = "Citation ";
    if (reverse == true) {
      document.getElementById("renverse2").setAttribute('onclick', 'tableaux(\'table_body\', 2, false)'); // pour inverse l'ordre de trirage 
      document.getElementById("renverse2").innerText = "Personnage ↓ "; //pour changer le symbole
    } else if (reverse == false) {
      document.getElementById("renverse2").setAttribute('onclick', 'tableaux(\'table_body\', 2, true)'); // pour inverse l'ordre de trirage 
      document.getElementById("renverse2").innerText = "Personnage  ↑ "; //pour changer le symbole
    }
  }
}
/**
 * @brief aide dans le sort() de triee les objects 
 * @param {object} a 
 * @param {object} b 
 * @param {integer} numero : indique le champs a acceder dans l'object a et b 
 * @returns -1, 1 ou 0 pour triee de façon A->Z  
 */
function sortAZ(a, b, numero) {
  const elementA = Object.values(a)[numero];
  const elementB = Object.values(b)[numero];

  if (elementA < elementB) {
    return -1;
  } else if (elementA > elementB) {
    return 1;
  } else return 0;
}

/**
 * @brief aide dans le sort() de triee les objects 
 * @param {object} a 
 * @param {object} b 
 * @param {integer} numero : indique le champs a acceder dans l'object a et b 
 * @returns -1, 1 ou 0 pour triee de façon Z->A 
 */
function sortZA(a, b, numero) {
  const elementA = Object.values(a)[numero];
  const elementB = Object.values(b)[numero];

  if (elementA > elementB) {
    return -1;
  } else if (elementA < elementB) {
    return 1;
  } else return 0;
}

//////////////////////////////////////////////////////
///////////// tirage avec champs (input) /////////////
//////////////////////////////////////////////////////

/**
 * @brief fonction qui gere le tirage au fonction des champs input 
 * @param {object} data : object avec tous les citations 
 * @param {string} idTab : id du table-body 
 * @param {integer} numeroSort : numero qui indique si le champs utilise est celui de personnage ou citation 
 */
function inputTirage(data, idTab, numeroSort) {

  if (numeroSort == 2) {
    const inputText = document.getElementById("inputCharacter").value;
    const new_data = data.filter(n => checkAppearence(n, inputText, 2));

    genererTableaux(idTab, new_data);

  } else if (numeroSort == 1) {
    const inputText = document.getElementById("inputCitation").value;
    const new_data = data.filter(n => checkAppearence(n, inputText, 1));

    genererTableaux(idTab, new_data);
  }
}

/**
 * @brief fonction qui retourne vrai ou false pour filtrer les citations  
 * @param {object} singleObject : une object du form {id, quote, character ... }
 * @param {string} inputText : string de texte recupère d'une champs d'input
 * @param {integer} numero : qui indique quelle champs on prends d'une object
 * @returns true or false : pour aider le array.filter(checkApperance()) 
 */
function checkAppearence(singleObject, inputText, numero) {
  const string = Object.values(singleObject)[numero];  // string 

  // avec cette condition, on evite de traiter les citations mal saisie par les autres étudiants 
  if (isNaN(string) && string !== undefined) {
    const rest = string.match(inputText);
    return rest !== null;
  }
}

////////////////////////////////////////////////////////
//////////// details d'une citation ////////////////////
////////////////////////////////////////////////////////

/**
 * Fait une requête GET authentifiée sur /citations/id 
 * @returns une citation ou une message d'erreur
 */
function fetchUneCitationById(id) {
  return fetch(serverUrl + "/citations/" + id, { headers: { "x-api-key": apiKey } })
    .then((response) => response.json())
    .then((jsonData) => {
      if (jsonData.status && Number(jsonData.status) != 200) {
        return { err: jsonData.message };
      }
      return jsonData;
    })
    .catch((erreur) => ({ err: erreur }));
}

/**
 * @brief 
 * @param {string} id 
 * @returns 
 */
function afficherDetails(id) {
  console.log("Afficher details de : " + id);

  return fetchUneCitationById(id).then((citation) => {
    afficherDetailsScore(citation);
    const str = Object.entries(citation).map(n => {

      if ((n[0] !== "_id") && n[0] !== "scores" && (n[0] !== "__v")) {
        if (n[0] == "image") {
          document.getElementById("image_modal").innerHTML = '<img id="image_modal" src="' + n[1] + '" alt="image">';
        } else return '<tr>' + '<th>' + n[0] + ':' + '</th>' + '' + '<th>' + n[1] + '</th>' + '</tr>';

      }
    });
    afficherDetailsScore(citation);
    document.getElementById("texte_modal").innerHTML = str.join('');
    modale(id);
  });
}

/**
 * @function fonction qui gere l'affichage du tableau scores 
 * @param {object} citation : object sous la forme de { ".. " : {..}, ".. ": {..}} 
 */
function afficherDetailsScore(citation) {
  console.log("afficher details sur le tableaux score")

  if (citation.scores == undefined) {
    console.log("champs scores is undefined")
    document.getElementById("text_score").innerHTML = "Cette citation n'a pas encore participe dans une duel";
  } else {
    creerTableScores(citation);
  }
}
/**
 * @brief fonction qui cree une tableau pour les scores rempli avec les wins/looses/quotes
 * @param {object} citation : object sous la forme de { ".. " : {..}, ".. ": {..}} 
 */
function creerTableScores(citation) {

  const arrIds = Object.entries(citation.scores).map(p => p[1]); // creer une array pour être capable de retrouver une index 

  const str = Object.entries(citation.scores).map(n => { // map pour creer le tableaux avec le troisieme collone vide 
    const index = arrIds.indexOf(n[1]); // find index of the _id in the arrIds 
    const id_colonne = "insertQuote" + index; // creer un id pour la troisieme collone du tableaux 
    return '<tr><th>' + n[1].wins + '</th><th>' + n[1].looses + '</th><th id="' + id_colonne + '"></th></tr>';
  })

  document.getElementById("table_score").innerHTML = str.join('')

  Object.entries(citation.scores).map(p => { // ce partie va remplir le troisieme collonne du tableaux 
    const index = arrIds.indexOf(p[1]);
    quoteDansDetailsScoreTableaux(p[0], index);
  })
}

/**
 * @brief fonction qui rempli le troisieme colone du tableaux 
 * @param {string} n : avec le _id d'une citation 
 */
function quoteDansDetailsScoreTableaux(n, index) {

  fetchUneCitationById(n).then(data => {
    const strDejaLa = document.getElementById("insertQuote" + index).innerText;
    const strCourte = debutQuote(data.quote) // prends le moitee du quote 

    if (strDejaLa.includes(strCourte) == false) { // pour assurer qu'on n'a pas plusieurs fois le meme quote 
      document.getElementById("insertQuote" + index).innerHTML = strDejaLa + strCourte;
    }

  })
}

/**
 * @brief fonction qui retourne le premiere moite d'une string 
 * @param {string} quote 
 * @returns le premiere trois mots d'une string
 */
function debutQuote(quote) {

  const arrQuote = quote.split(" "); // convert en array comme ca on peut compter le numero de mots 
  const arrLength = arrQuote.length; // converser le longeur
  console.log("original length of quote : " + arrLength)
  const newArrLength = parseInt(0.5 * arrLength); // creer un integer pour le nouveau longeur 
  arrQuote.length = newArrLength;
  return arrQuote.join(" ")
}

/**
 * @brief fonction qui gere l'affichage du fenetre modale 
 * @param {string} id 
 */
function modale(id) {
  console.log("cal modale(" + id + ")");

  const modal = document.getElementById("myModal");
  const btn = document.getElementById(id);
  const span = document.getElementsByClassName("close")[0];

  btn.onclick = function () { modal.style.display = "block"; }
  span.onclick = function () { modal.style.display = "none"; }

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
}

/////////////////////////////////////////////////////////////////////
///////////////////////////////random image//////////////////////////
/////////////////////////////////////////////////////////////////////

/**
 * @brief fonction qui select deux citation pour afficher dans le duel 
 * @param {object} data : sous la forme de  
 */
function selectRandomImage(data) {
  const nbCitations = data.length;
  const random1 = Math.floor(Math.random() * nbCitations);
  const random2 = Math.floor(Math.random() * nbCitations);

  if (random1 == random2) { // verifier que on a bien deux citations differents 
    selectRandomImage(data);
  } else {
    const citation1 = data[random1]; // citation left 
    const citation2 = data[random2]; // citation right 

    creerCardHTML(1, citation1);
    creerCardHTML(2, citation2);

    document.getElementById("voteDroite").innerHTML = '<p class="button is-info" onclick="prendsEnCompteVote(\'' + citation2._id + '\',\'' + citation1._id + '\')"> Voter pour la citation de droite !</p> ';
    document.getElementById("voteGauche").innerHTML = '<p class="button is-danger" onclick="prendsEnCompteVote(\'' + citation1._id + '\',\'' + citation2._id + '\')">Voter pour la citation de gauche !</p>';

  }

}

/**
 * @brief fonction qui gere le code html pour les sur le page vote 
 * @param {number} numero : indiquation si le citation est celui de gauche (1) ou de droite (2) 
 * @param {object} citation : information sur le qoute comme {id, quote, chractere, image, characterDirection origin}
 */
function creerCardHTML(numero, citation) {
  document.getElementById("citation" + numero).innerText = citation.quote;
  document.getElementById("character" + numero).innerText = citation.character + " dans " + citation.origin;

  const inverseImage = '" style="transform: scaleX(-1)" />'

  if (numero == 1) {
    if (citation.characterDirection == "Right") {
      document.getElementById("image" + numero).innerHTML = "<img src=\"" + citation.image + inverseImage;
    } else document.getElementById("image" + numero).innerHTML = '<img src="' + citation.image + '" />'
  } else if (numero == 2) {

    if (citation.characterDirection == "Left") {
      document.getElementById("image" + numero).innerHTML = "<img src=\"" + citation.image + inverseImage;
    } else document.getElementById("image" + numero).innerHTML = '<img src="' + citation.image + '" />'
  }
}


//////////////////////////////////////////////////
//////////////// fonctionalite voter ////////////
/////////////////////////////////////////////////

/**
 * @brief fonction qui envoie le resultat du vote aux serveur (et apres fait tableaux(..) pour afficher une nouveau duel)
 * @param {string} winner : _id du citation qui a gagne 
 * @param {string} looser  : _id du citation qui a perdu 
 */
function prendsEnCompteVote(winner, looser) {
  console.log("vote pour " + winner)

  fetch(serverUrl + "/citations/duels", {
    method: 'POST',
    headers: { 'x-api-key': apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      "winner": winner,
      "looser": looser
    })
  })

  tableaux("table_body")
}



/* ******************************************************************
 * Gestion de la boîte de dialogue (a.k.a. modal) d'affichage de
 * l'utilisateur.
 * ****************************************************************** */

/**
 * Fait une requête GET authentifiée sur /whoami
 * @returns une promesse du login utilisateur ou du message d'erreur
 */
function fetchWhoami() {
  return fetch(serverUrl + "/whoami", { headers: { "x-api-key": apiKey } })
    .then((response) => response.json())
    .then((jsonData) => {
      if (jsonData.status && Number(jsonData.status) != 200) {
        return { err: jsonData.message };
      }
      return jsonData;
    })
    .catch((erreur) => ({ err: erreur }));
}

/**
 * Fait une requête sur le serveur et insère le login dans
 * la modale d'affichage de l'utilisateur.
 * @returns Une promesse de mise à jour
 */
function lanceWhoamiEtInsereLogin() {
  return fetchWhoami().then((data) => {
    const elt = document.getElementById("elt-affichage-login");
    const ok = data.err === undefined;
    if (!ok) {
      elt.innerHTML = `<span class="is-error">${data.err}</span>`;
    } else {
      elt.innerHTML = `Bonjour ${data.login}.`;
    }
    return ok;
  });
}

/**
 * Affiche ou masque la fenêtre modale de login en fonction de l'état courant.
 *
 * @param {Etat} etatCourant l'état courant
 */
function majModalLogin(etatCourant) {
  const modalClasses = document.getElementById("mdl-login").classList;
  if (etatCourant.loginModal) {
    modalClasses.add("is-active");
    lanceWhoamiEtInsereLogin();
  } else {
    modalClasses.remove("is-active");
  }
}

/**
 * Déclenche l'affichage de la boîte de dialogue du nom de l'utilisateur.
 * @param {Etat} etatCourant
 */
function clickFermeModalLogin(etatCourant) {
  etatCourant.loginModal = false;
  majPage(etatCourant);
}

/**
 * Déclenche la fermeture de la boîte de dialogue du nom de l'utilisateur.
 * @param {Etat} etatCourant
 */
function clickOuvreModalLogin(etatCourant) {
  etatCourant.loginModal = true;
  majPage(etatCourant);
}

/**
 * Enregistre les actions à effectuer lors d'un click sur les boutons
 * d'ouverture/fermeture de la boîte de dialogue affichant l'utilisateur.
 * @param {Etat} etatCourant
 */
function registerLoginModalClick(etatCourant) {
  document.getElementById("btn-close-login-modal1").onclick = () =>
    clickFermeModalLogin(etatCourant);
  document.getElementById("btn-close-login-modal2").onclick = () =>
    clickFermeModalLogin(etatCourant);
  document.getElementById("btn-open-login-modal").onclick = () =>
    clickOuvreModalLogin(etatCourant);
}

/* ******************************************************************
 * Initialisation de la page et fonction de mise à jour
 * globale de la page.
 * ****************************************************************** */

/**
 * Mets à jour la page (contenu et événements) en fonction d'un nouvel état.
 *
 * @param {Etat} etatCourant l'état courant
 */
function majPage(etatCourant) {
  console.log("CALL majPage");
  majTab(etatCourant);
  majModalLogin(etatCourant);
  registerTabClick(etatCourant);
  registerLoginModalClick(etatCourant);
}

/**
 * Appelé après le chargement de la page.
 * Met en place la mécanique de gestion des événements
 * en lançant la mise à jour de la page à partir d'un état initial.
 */
function initClientCitations() {
  console.log("CALL initClientCitations");
  const etatInitial = {
    tab: "duel",
    loginModal: false,
    citationChanged: true,

  };
  majPage(etatInitial);
}

// Appel de la fonction init_client_duels au après chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Exécution du code après chargement de la page");
  initClientCitations();
});
