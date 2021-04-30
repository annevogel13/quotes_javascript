/// TEST 

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
  
   // tableaux("table_body") --> il y est la dans le client.js mais pour tester si vote a marche on n'a pas besoin 
  }
  


function testVoter(idCitationW, idCitationL){
   
    afficherObject(idCitationW);
    afficherObject(idCitationL);  
    
    
   prendsEnCompteVote(idCitationW, idCitationL)
  
  }
  
  function afficherObject(idCitation){
    fetchUneCitationById(idCitation).then(citation =>{
       const id ="<li>"+citation._id+"</li>"
       const quote = "<li>"+citation.quote+"</li>" 
       const image = "<li>"+citation.image+"</li>" 
       const character = "<li>"+citation.character+"</li>"
       const caractereD = "<li>"+citation.characterDirection+"</li>" 
       const orgin = "<li>"+citation.origin+"</li>" 
       const scores = citatoin.scores; 
  
    })
  }

  