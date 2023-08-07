const sender = document.getElementById("sender");
const collectionFile = document.getElementById("collection-file");
const globalVar = document.getElementById("global-var-file");
const mainbtnCon = document.getElementById("main");

sender.addEventListener("click", () => {
    if (collectionFile.children[2].files.length < 1) {
        const alert = document.createElement("div");
        alert.textContent = "Collection .json is empty"
        alert.id = "alert"
        if (document.getElementById("alert") !== null) {
            return
        }
        mainbtnCon.appendChild(alert)
        return
    }

    const data = {
        file: collectionFile.children[2].files[0]
    };

    const reader = new FileReader();
    reader.onload = function (event) {
        const result = event.target.result;

        const url = 'http://localhost:3000/test';
        const data = {
            "file": result
        }
        const options = {
            method: 'POST', // Método HTTP de la petición
            headers: {
                'Content-Type': 'application/json' // Tipo de contenido que estás enviando (JSON en este caso)
                // Puedes agregar más encabezados aquí si es necesario, como tokens de autenticación
            },
            body: JSON.stringify(data) // Datos que se enviarán en el cuerpo de la petición (convertidos a JSON)
        };

        // Realiza la petición fetch
        fetch(url, options)
            .then(response => response.json())
            .then(data => downloadFiles(data.uri)) // Parsea la respuesta como JSON
            .catch(error => {
                console.error('Error:', error); // Muestra el error en la consola en caso de fallo
            });

    }

    reader.readAsText(collectionFile.children[2].files[0])
})

function downloadFiles(htmlFileName) {
    const container = document.createElement("div")
    const title = document.createElement("h1");
    const subtitle = document.createElement("p");
    const downloadBtn = document.createElement("a")

    title.textContent = "Congratulation!"
    subtitle.textContent = "Your documentation is ready now"
    downloadBtn.textContent = "Download as HTML"
    const uri = `${window.location.protocol}//${window.location.host}/generated/${htmlFileName}.html`
    downloadBtn.href=uri
    downloadBtn.setAttribute("download", "");

    downloadBtn.classList.add("down")
    document.body.innerHTML =''
    container.appendChild(title)
    container.appendChild(subtitle)
    container.appendChild(downloadBtn)
    document.body.appendChild(container)
    document.body.removeAttribute("class")
    document.body.classList.add("great")
}