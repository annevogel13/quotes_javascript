/* ******************************************************************
 * Constantes de configuration
 */
const apiKey = '5f8ba44f-1ba2-4d31-91fe-8b4e37a70279'
const serverUrl = 'https://lifap5.univ-lyon1.fr'

/* ******************************************************************
 * Gestion des tabs "Voter" et "Toutes les citations"
 ******************************************************************** */

/* eslint max-len: ["error", { "code": 80, "tabWidth": 4 }] */
/**
 * Affiche/masque les divs "div-duel" et "div-tout"
 * selon le tab indiqué dans l'état courant.
 *
 * @param {Etat} etatCourant l'état courant
 */
function majTab (etatCourant) {
  console.log('CALL majTab')
  const dDuel = document.getElementById('div-duel')
  const dTout = document.getElementById('div-tout')
  const tDuel = document.getElementById('tab-duel')
  const tTout = document.getElementById('tab-tout')

  if (etatCourant.citationChanged) tableaux('table_body')

  if (etatCourant.tab === 'duel') {
    dDuel.style.display = 'flex'
    tDuel.classList.add('is-active')
    dTout.style.display = 'none'
    tTout.classList.remove('is-active')
  } else {
    dTout.style.display = 'flex'
    tTout.classList.add('is-active')
    dDuel.style.display = 'none'
    tDuel.classList.remove('is-active')
  }
}

/**
 * Mets au besoin à jour l'état courant lors d'un click sur un tab.
 * En cas de mise à jour, déclenche une mise à jour de la page.
 *
 * @param {String} tab le nom du tab qui a été cliqué
 * @param {Etat} etatCourant l'état courant
 */
function clickTab (tab, etatCourant) {
  console.log(`CALL clickTab(${tab},...)`)
  if (etatCourant.tab !== tab) {
    etatCourant.tab = tab
    majPage(etatCourant)
  }
}

/**
 * Enregistre les fonctions à utiliser lorsque l'on clique
 * sur un des tabs.
 *
 * @param {Etat} etatCourant l'état courant
 */
function registerTabClick (etatCourant) {
  console.log('CALL registerTabClick')
  document.getElementById('tab-duel').onclick = () =>
    clickTab('duel', etatCourant)
  document.getElementById('tab-tout').onclick = () =>
    clickTab('tout', etatCourant)
}

/// //////////////////////////////////////////////////////////////////
/// //// affichage de l'ensemble des citations du serveur 1 /////////
/// /////////////////////////////////////////////////////////////////

/**
 * @brief Fait une requête GET authentifiée sur /citations
 * @returns les citations ou une message d'erreur
 */
function fetchTousCitations () {
  return fetch(serverUrl + '/citations', { headers: { 'x-api-key': apiKey } })
    .then((response) => response.json())
    .then((jsonData) => {
      if (jsonData.status && Number(jsonData.status) !== 200) {
        return { err: jsonData.message }
      }
      return jsonData
    })
    .catch((erreur) => ({ err: erreur }))
}

/**
 * @brief transforms the data in a string which in html is a table
 * @param {string} idTab
 *
 */
function genererTableaux (idTab, data) { // make tableau
  const str = data.map(n => {
    const p1 = '<button class="detail_button" id="'
    const p2 = '" onclick="afficherDetails(\''
    const p3 = '\')">Détails</button>'
    const button = p1 + Object.values(n)[0] + p2 + Object.values(n)[0] + p3

    const arr = [n.rang, n.character, n.quote, button]
    return '<tr>' + creerUneLigneDansLeTableau(arr) + '</tr>'
  })

  document.getElementById(idTab).innerHTML = str.join('')
}

/**
 * @brief creates a string with html-code
 * @param {string} tab
 * @returns a string with the html-code for a case in a row
 */
function creerUneLigneDansLeTableau (tab) {
  return tab.map(n => '<th>' + n + '</th>').join('')
}

/**
 * @brief fonction qui gerer le tableau de citations
 * @param {identifier} idtab : l'id du <table-body>
 */
function tableaux (idtab, numeroSort, reverse) {
  fetchTousCitations().then((data) => {
    selectRandomImage(data) // affichage des duels
    // ajoute d'une champs "rang" dans une object pour changer le classement
    const newData = addClassement(data)
    // triee les champs de facon AZ ou ZA
    sortColoms(newData, idtab, numeroSort, reverse)
    // si input champs est vide --> tous les citations
    inputTirage(newData, idtab, numeroSort)
  })
}

/// //////////////////////////////////////////////////////////////////
/// //////// functions des classements ///////////////////////////////
/// //////////////////////////////////////////////////////////////////

function addClassement (data) {
  const newData = data.map(n => {
    if (n.scores !== undefined) {
      const classement = victoiresAbsolu(n.scores)
      n.rang = classement
    } else {
      n.rang = 0 // pas participe dans une duel donc le rang est neutre ==> 0
    }
    return n
  })
  // indice de "rang" est 7
  const sortedData = newData.sort((a, b) => sortAZ(a, b, 7))
  return sortedData
}

/**
 *
 * @param {object} scores : object sous la forme de { "..." : {...}, }
 * @returns
 */
function victoiresAbsolu (scores) {
  const winAbsolu = Object.entries(scores).map(n => nbWinAbsolu(n))
  return winAbsolu.reduce(total)
}

/**
 * @brief fonction qui est a utilise dans une reduce() pour faire la somme
 * @param {integer} total
 * @param {integer} n
 * @returns le somme des element dans une array
 */
function total (total, n) {
  return total + n
}

/**
 * @brief fonction qui retourne le nombre de victoires absolu d'une citation
 * @param {object} n : une object avec les champs {id, wins, looses}
 * @returns le nombre de victoires absolu
 */
function nbWinAbsolu (n) {
  const win = n[1].wins // Object.values(n[1])[1].wins;
  const looses = n[1].looses// Object.values(n[1])[1].looses;
  const winAbsolu = win - looses

  return winAbsolu
}

/// //////////////////////////////////////////////////
/// ///////// trie tableaux /////////////////////////
/// ////////////////////////////////////////////////
/**
 *
 * @param {object} data : tous les citations
 * @param {string} idtab : identifier du tableau (table-body)
 * @param {integer} numeroSort : numero pour indiquer ou on triee
 * @param {boolean} reverse : indiquer si on utilise AZ ou ZA
 */
function sortColoms (data, idtab, numeroSort, reverse) {
  if (reverse) {
    const newData = data.sort((a, b) => sortAZ(a, b, numeroSort))
    genererTableaux(idtab, newData)
    changeLeTete(numeroSort, reverse)
    return newData
  }

  if (!reverse) {
    const reverseData = data.sort((a, b) => sortZA(a, b, numeroSort))
    genererTableaux(idtab, reverseData)
    changeLeTete(numeroSort, reverse)
    return reverseData
  }
}

/**
 * @brief fonction qui change les entêtes des colommes (avec symbole)
 * @param {number} numeroSort : le colonnee personnage (2) ou citation (1)
 * @param {bool} reverse : indique le facon de triee (AZ ou ZA)
 */
function changeLeTete (numeroSort, reverse) {
  if (numeroSort === 1) {
    sortCharacter(reverse)
  } else if (numeroSort === 2) {
    sortCitation(reverse)
  }
}

/**
 * @brief fonction qui gere le facon d'on trie les characters
 * @param {bool} reverse : indique le facon de trie
 */
function sortCharacter (reverse) {
  document.getElementById('r2').innerText = 'Personnage'
  if (reverse === true) {
    // pour inverse l'ordre de trirage
    const newF = 'tableaux(\'table_body\', 1, false)'
    document.getElementById('r1').setAttribute('onclick', newF)
    // pour changer le symbole
    document.getElementById('r1').innerText = 'Citation ↓ '
  } else if (reverse === false) {
    const newF1 = 'tableaux(\'table_body\', 1, true)'
    // pour inverse l'ordre de trirage
    document.getElementById('r1').setAttribute('onclick', newF1)
    // pour changer le symbole
    document.getElementById('r1').innerText = 'Citation  ↑ '
  }
}

/**
 * @brief fonction qui gere le facon d'on trie les citations
 * @param {bool} reverse : indique le facon de trie
 */
function sortCitation (reverse) {
  document.getElementById('r1').innerText = 'Citation '
  if (reverse === true) {
    const newF2 = 'tableaux(\'table_body\', 2, false)'
    // pour inverse l'ordre de trirage
    document.getElementById('r2').setAttribute('onclick', newF2)
    // pour changer le symbole
    document.getElementById('r2').innerText = 'Personnage ↓ '
  } else if (reverse === false) {
    const newF3 = 'tableaux(\'table_body\', 2, true)'
    // pour inverse l'ordre de trirage
    document.getElementById('r2').setAttribute('onclick', newF3)
    // pour changer le symbole
    document.getElementById('r2').innerText = 'Personnage  ↑ '
  }
}
/**
 * @brief aide dans le sort() de triee les objects
 * @param {object} a
 * @param {object} b
 * @param {integer} numero : indique le champs a acceder dans l'object a et b
 * @returns -1, 1 ou 0 pour triee de façon A->Z
 */
function sortAZ (a, b, numero) {
  const elementA = Object.values(a)[numero]
  const elementB = Object.values(b)[numero]

  if (elementA < elementB) {
    return -1
  } else if (elementA > elementB) {
    return 1
  } else return 0
}

/**
 * @brief aide dans le sort() de triee les objects
 * @param {object} a
 * @param {object} b
 * @param {integer} numero : indique le champs a acceder dans l'object a et b
 * @returns -1, 1 ou 0 pour triee de façon Z->A
 */
function sortZA (a, b, numero) {
  const elementA = Object.values(a)[numero]
  const elementB = Object.values(b)[numero]

  if (elementA > elementB) {
    return -1
  } else if (elementA < elementB) {
    return 1
  } else return 0
}

/// ///////////////////////////////////////////////////
/// ////////// tirage avec champs (input) /////////////
/// ///////////////////////////////////////////////////

/**
 * @brief fonction qui gere le tirage au fonction des champs input
 * @param {object} data : object avec tous les citations
 * @param {string} idTab : id du table-body
 * @param {integer} numeroSort : indique si tirage est dans personnage/citation
 */
function inputTirage (data, idTab, numeroSort) {
  if (numeroSort === 2) {
    const inputText = document.getElementById('inputCharacter').value
    const newData = data.filter(n => checkAppearence(n, inputText, 2))

    genererTableaux(idTab, newData)
  } else if (numeroSort === 1) {
    const inputText = document.getElementById('inputCitation').value
    const newData = data.filter(n => checkAppearence(n, inputText, 1))

    genererTableaux(idTab, newData)
  }
}

/**
 * @brief fonction qui retourne vrai ou false pour filtrer les citations
 * @param {object} singleObject : une object du form {id, quote, character ... }
 * @param {string} inputText : string de texte recupère d'une champs d'input
 * @param {integer} numero : qui indique quelle champs on prends d'une object
 * @returns true or false : pour aider le array.filter(checkApperance())
 */
function checkAppearence (singleObject, inputText, numero) {
  const string = Object.values(singleObject)[numero] // string

  // on evite de traiter les citations mal saisie par les autres étudiants
  if (isNaN(string) && string !== undefined) {
    const rest = string.match(inputText)
    return rest !== null
  }
}

/// /////////////////////////////////////////////////////
/// ///////// details d'une citation ////////////////////
/// /////////////////////////////////////////////////////

/**
 * Fait une requête GET authentifiée sur /citations/id
 * @returns une citation ou une message d'erreur
 */
function fetchUneCitationById (id) {
  const url = serverUrl + '/citations/' + id
  return fetch(url, { headers: { 'x-api-key': apiKey } })
    .then((response) => response.json())
    .then((jsonData) => {
      if (jsonData.status && Number(jsonData.status) !== 200) {
        return { err: jsonData.message }
      }
      return jsonData
    })
    .catch((erreur) => ({ err: erreur }))
}

/**
 * @brief function qui affiche le fenêtre modale
 * @param {string} id : id du quote
 * @returns le resultat du fetch
 */
function afficherDetails (id) { // utilise dans onclick function
  console.log('Afficher details de : ' + id)

  return fetchUneCitationById(id).then((citation) => {
    afficherDetailsScore(citation)
    const str = Object.entries(citation).map(n => {
      if ((n[0] !== '_id') && n[0] !== 'scores' && (n[0] !== '__v')) {
        if (n[0] === 'image') {
          const image = '<img id="image_modal" src="' + n[1] + '" alt="image">'
          document.getElementById('image_modal').innerHTML = image
          return ''
        } else return '<tr><th>' + n[0] + ':</th><th>' + n[1] + '</th></tr>'
      } else return ''
    })
    afficherDetailsScore(citation)
    document.getElementById('texte_modal').innerHTML = str.join('')
    modale(id)
  })
}

/**
 * @function fonction qui gere l'affichage du tableau scores
 * @param {object} citation : object avec les citations
 */
function afficherDetailsScore (citation) {
  if (citation.scores === undefined) {
    console.log('champs scores is undefined')
    const string = "Cette citation n'a pas encore participe dans une duel"
    document.getElementById('text_score').innerHTML = string
  } else {
    creerTableScores(citation)
  }
}
/**
 * @brief fonction qui cree une tableau avec les wins/looses/quotes
 * @param {object} citation : object avec les citations
 */
function creerTableScores (citation) {
  // creer une array pour être capable de retrouver une index
  const arrIds = Object.entries(citation.scores).map(p => p[1])
  // map pour creer le tableaux avec le troisieme collone vide
  const str = Object.entries(citation.scores).map(n => {
    // find index of the _id in the arrIds
    const index = arrIds.indexOf(n[1])
    // creer un id pour la troisieme collone du tableaux
    const idColonne = 'insert' + index
    const p1 = '<tr><th>'; const p2 = '</th><th>'
    const p3 = '</th><th id="'; const p4 = '"></th></tr>'
    return p1 + n[1].wins + p2 + n[1].looses + p3 + idColonne + p4
  })

  document.getElementById('table_score').innerHTML = str.join('')
  // ce partie va remplir le troisieme collonne du tableaux
  Object.entries(citation.scores).map(p => {
    const index = arrIds.indexOf(p[1])
    return quoteDansDetailsScoreTableaux(p[0], index)
  })
}

/**
 * @brief fonction qui rempli le troisieme colone du tableaux
 * @param {string} n : avec le _id d'une citation
 */
function quoteDansDetailsScoreTableaux (n, index) {
  fetchUneCitationById(n).then(data => {
    const strOld = document.getElementById('insert' + index).innerText
    const strCourte = debutQuote(data.quote) // prends le moitee du quote
    // pour assurer qu'on n'a pas plusieurs fois le meme quote
    if (strOld.includes(strCourte) === false) {
      document.getElementById('insert' + index).innerHTML = strOld + strCourte
    }
  })
}

/**
 * @brief fonction qui retourne le premiere moite d'une string
 * @param {string} quote
 * @returns le premiere trois mots d'une string
 */
function debutQuote (quote) {
  // convert en array comme ca on peut compter le numero de mots
  const arrQuote = quote.split(' ')
  const arrLength = arrQuote.length // converser le longeur
  
  // creer un integer pour le nouveau longeur
  const newArrLength = parseInt(0.5 * arrLength)
  arrQuote.length = newArrLength
  return arrQuote.join(' ')
}

/**
 * @brief fonction qui gere l'affichage du fenetre modale
 * @param {string} id
 */
function modale (id) {
  console.log('cal modale(' + id + ')')

  const modal = document.getElementById('myModal')
  const btn = document.getElementById(id)
  const span = document.getElementsByClassName('close')[0]

  btn.onclick = function () { modal.style.display = 'block' }
  span.onclick = function () { modal.style.display = 'none' }

  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = 'none'
    }
  }
}

/// //////////////////////////////////////////////////////////////////
/// ////////////////////////////random image//////////////////////////
/// //////////////////////////////////////////////////////////////////

/**
 * @brief fonction qui select deux citation pour afficher dans le duel
 * @param {object} data : sous la forme de
 */
function selectRandomImage (data) {
  const nbCitations = data.length
  const random1 = Math.floor(Math.random() * nbCitations)
  const random2 = Math.floor(Math.random() * nbCitations)

  if (random1 === random2) { // verifier que on a bien deux citations differents
    selectRandomImage(data)
  } else {
    const c1 = data[random1]; creerCardHTML(1, c1) // citation left
    const c2 = data[random2]; creerCardHTML(2, c2) // citation right

    const DP1 = '<p class="button is-info" onclick='
    const onclick1 = '"prendsEnCompteVote(\'' + c2._id + "','" + c1._id + '\')"'
    const DP2 = '> Voter pour la citation de droite !</p> '
    document.getElementById('voteDroite').innerHTML = DP1 + onclick1 + DP2
    const GP1 = '<p class="button is-danger" onclick='
    const onclick2 = '"prendsEnCompteVote(\'' + c1._id + "','" + c2._id + '\')"'
    const GP2 = '>Voter pour la citation de gauche !</p>'
    document.getElementById('voteGauche').innerHTML = GP1 + onclick2 + GP2
  }
}

/**
 * @brief fonction qui gere le code html pour les sur le page vote
 * @param {number} numero : indiqeur citation de gauche (1) ou droite (2)
 * @param {object} citation : information sur le qoute dans un object
 */
function creerCardHTML (numero, c) {
  document.getElementById('citation' + numero).innerText = c.quote
  const sousTitre = c.character + ' dans ' + c.origin
  document.getElementById('character' + numero).innerText = sousTitre

  const inverseImage = '" style="transform: scaleX(-1)" />'
  const imgInverse = '<img src="' + c.image + inverseImage
  const img = '<img src="' + c.image + '" />'

  if (numero === 1) {
    if (c.characterDirection === 'Right') {
      document.getElementById('image' + numero).innerHTML = imgInverse
    } else document.getElementById('image' + numero).innerHTML = img
  } else if (numero === 2) {
    if (c.characterDirection === 'Left') {
      document.getElementById('image' + numero).innerHTML = imgInverse
    } else document.getElementById('image' + numero).innerHTML = img
  }
}

/// ///////////////////////////////////////////////
/// ///////////// fonctionalite voter ////////////
/// //////////////////////////////////////////////

/**
 * @brief fonction qui envoie le resultat du vote aux serveur
 * @param {string} winner : _id du citation qui a gagne
 * @param {string} looser  : _id du citation qui a perdu
 */
function prendsEnCompteVote (winner, looser) { // onclick function
  console.log('vote pour ' + winner)

  fetch(serverUrl + '/citations/duels', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      winner: winner,
      looser: looser
    })
  })

  tableaux('table_body')
}

/* ******************************************************************
 * Gestion de la boîte de dialogue (a.k.a. modal) d'affichage de
 * l'utilisateur.
 * ****************************************************************** */

/**
 * Fait une requête GET authentifiée sur /whoami
 * @returns une promesse du login utilisateur ou du message d'erreur
 */
function fetchWhoami () {
  return fetch(serverUrl + '/whoami', { headers: { 'x-api-key': apiKey } })
    .then((response) => response.json())
    .then((jsonData) => {
      if (jsonData.status && Number(jsonData.status) !== 200) {
        return { err: jsonData.message }
      }
      return jsonData
    })
    .catch((erreur) => ({ err: erreur }))
}

/**
 * Fait une requête sur le serveur et insère le login dans
 * la modale d'affichage de l'utilisateur.
 * @returns Une promesse de mise à jour
 */
function lanceWhoamiEtInsereLogin () {
  return fetchWhoami().then((data) => {
    const elt = document.getElementById('elt-affichage-login')
    const ok = data.err === undefined
    if (!ok) {
      elt.innerHTML = `<span class="is-error">${data.err}</span>`
    } else {
      elt.innerHTML = `Bonjour ${data.login}.`
    }
    return ok
  })
}

/**
 * Affiche ou masque la fenêtre modale de login en fonction de l'état courant.
 *
 * @param {Etat} etatCourant l'état courant
 */
function majModalLogin (etatCourant) {
  const modalClasses = document.getElementById('mdl-login').classList
  if (etatCourant.loginModal) {
    modalClasses.add('is-active')
    lanceWhoamiEtInsereLogin()
  } else {
    modalClasses.remove('is-active')
  }
}

/**
 * Déclenche l'affichage de la boîte de dialogue du nom de l'utilisateur.
 * @param {Etat} etatCourant
 */
function clickFermeModalLogin (etatCourant) {
  etatCourant.loginModal = false
  majPage(etatCourant)
}

/**
 * Déclenche la fermeture de la boîte de dialogue du nom de l'utilisateur.
 * @param {Etat} etatCourant
 */
function clickOuvreModalLogin (etatCourant) {
  etatCourant.loginModal = true
  majPage(etatCourant)
}

/**
 * Enregistre les actions à effectuer lors d'un click sur les boutons
 * d'ouverture/fermeture de la boîte de dialogue affichant l'utilisateur.
 * @param {Etat} etatCourant
 */
function registerLoginModalClick (etatCourant) {
  document.getElementById('btn-close-login-modal1').onclick = () =>
    clickFermeModalLogin(etatCourant)
  document.getElementById('btn-close-login-modal2').onclick = () =>
    clickFermeModalLogin(etatCourant)
  document.getElementById('btn-open-login-modal').onclick = () =>
    clickOuvreModalLogin(etatCourant)
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
function majPage (etatCourant) {
  console.log('CALL majPage')
  majTab(etatCourant)
  majModalLogin(etatCourant)
  registerTabClick(etatCourant)
  registerLoginModalClick(etatCourant)
}

/**
 * Appelé après le chargement de la page.
 * Met en place la mécanique de gestion des événements
 * en lançant la mise à jour de la page à partir d'un état initial.
 */
function initClientCitations () {
  console.log('CALL initClientCitations')
  const etatInitial = {
    tab: 'duel',
    loginModal: false,
    citationChanged: true

  }
  majPage(etatInitial)
}

// Appel de la fonction init_client_duels au après chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  console.log('Exécution du code après chargement de la page')
  initClientCitations()
})
