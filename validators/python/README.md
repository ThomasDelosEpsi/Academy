# Python Validators

Ce dossier contient les scripts Python du correcteur RPA.

Objectif :
- ajouter des garde-fous deterministes
- completer l'evaluation IA
- rendre le niveau de difficulte configurable par cours

Structure :
- `runner.py` : point d'entree pour executer les regles actives
- `rules/` : scripts Python appeles pendant la verification
- `example_config.json` : exemple de payload a envoyer au runner

Execution :

```bash
python validators/python/runner.py --config validators/python/example_config.json
```

Le runner retourne un JSON avec :
- `passed`
- `blocking_failed`
- `warning_failed`
- `results`

Si au moins une regle `blocking` echoue, le process sort avec un code non nul.
