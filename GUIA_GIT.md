# Guía Rápida para Subir Cambios a GitHub

Cada vez que quieras guardar tus cambios en la nube (GitHub), abre una terminal en la carpeta de tu proyecto y ejecuta estos 3 comandos en orden:

## 1. Preparar los archivos (Add)
Este comando le dice a Git que "tome foto" de todos los archivos nuevos o modificados.
```powershell
git add .
```

## 2. Guardar la versión (Commit)
Este comando guarda la "foto" con un mensaje que describa qué hiciste.
*Cambia el mensaje entre comillas por lo que hayas hecho.*
```powershell
git commit -m "Descripción de mis cambios"
```

## 3. Subir a la nube (Push)
Este comando envía tus cambios guardados al servidor de GitHub.
```powershell
git push origin main
```

---

### Resumen en una sola línea
Si quieres hacerlo todo junto rápido, puedes copiar y pegar esto en PowerShell:
```powershell
git add . ; git commit -m "Actualización" ; git push origin main
```
