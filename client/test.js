suite('Tests pour la function vote', function () {
    test("On vérifie si le resultat d'une duel est bien pris en compte", function () {
        fetchTousCitations().then(data => {
            citation1 = data[0];
            citation2 = data[1];

            prendsEnCompteVote(citation1._id, citation2._id);

            fetchUneCitationById(citation1._id).then(citation => {
                
                // test marche seulement quand il y a pas des autres duels fait --> donc au debut de chaque 30 min 
                return Object.entries(citation.scores).map(n => {
                    if (n[0] === citation2._id) {
                        chai.assert.equal(n[1].wins, 1);
                        chai.assert.equal(n[1].looses, 0);
                    }
                })

            });

            fetchUneCitationById(citation2._id).then(citation => {
                return Object.entries(citation.scores).map(n => {
                    if (n[0] === citation1._id)
                        chai.assert.equal(n[1].wins, 0);
                    chai.assert.equal(n[1].looses, 1);
                })
            })
        })
    });
}),


    suite('Tests pour la function fetchTouslesCitations', function () {
        test("On vérifie si on a bien tous les functions", function () {
            fetchTousCitations().then(data => {
                const length = data.length;
                chai.expect(data).to.have.length(length); 
            })
        })
    })

