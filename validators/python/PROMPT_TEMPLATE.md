# Prompt Template Backend

Le backend doit construire le prompt a partir de 4 blocs :

1. `course`
- metadonnees du cours
- `rpaConfig.validationRules` actives
- schema de sortie attendu

2. `submission`
- resume de soumission
- liste des livrables declares
- fichiers attaches
- extrait texte ou code

3. `pythonValidation`
- resultats du runner Python
- blocants et warnings

4. `learner`
- contexte utilisateur minimal

## Principe

Les regles IA sont des criteres injectes dans le prompt.

Les regles Python sont des verifications deterministes.

Le correcteur IA ne doit jamais contredire un echec Python bloquant.

## Fichiers

- [prompt_builder.py](./prompt_builder.py) : construit les messages backend
- [example_llm_payload.json](./example_llm_payload.json) : exemple complet de payload

## Execution

```bash
python validators/python/prompt_builder.py --config validators/python/example_llm_payload.json
```

## Sortie attendue de l'IA

JSON strict avec :
- `decision`
- `score`
- `summary`
- `blocking_issues`
- `warnings`
- `strengths`
- `rubric`

## Integration backend

Pseudo-flux :

1. Charger le cours et les regles IA actives.
2. Executer `runner.py` sur la soumission.
3. Construire le payload de correction.
4. Generer `system` + `user` avec `prompt_builder.py`.
5. Envoyer le prompt au modele.
6. Fusionner la reponse IA avec les resultats Python pour la decision finale.
