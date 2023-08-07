const collection_div_container = document.getElementById("collection-file");
const variable_div_container = document.getElementById("global-var-file");

function dragOverHandler(event) {
    this.removeAttribute('class');

    if (event.type === 'dragenter') {
        this.children[0].textContent = "Drop!";
        this.children[1].textContent = "It's hot...";
        this.classList.add('file-dragged');
    }
    if (event.type === 'dragleave') {
        if (this.children[2].files.length > 0) {
            this.classList.add('file-dropped');
            this.children[0].textContent = "Done!";
            this.children[1].textContent = this.children[2].files[0].name;
            return
        }

        this.children[0].textContent = "Drag!";
        this.children[1].textContent = "Your .json file here";
        this.classList.add('file-drop');
    }
}

function updateNamesList(event) {
    const parent = event.target.offsetParent;

    parent.removeAttribute('class');

    if (event.target.files.length === 0) {
        parent.children[0].textContent = "Drag!";
        parent.children[1].textContent = "Your .json file here";
        parent.classList.add('file-drop');
        return
    }

    const filenameUplloaded = event.target.files[0].name;

    parent.classList.add('file-dropped');

    parent.children[0].textContent = "Done!";
    parent.children[1].textContent = filenameUplloaded;
}

function dropHandler() {
    this.removeAttribute('class');
    if (this.children[2].files.length > 0) {
        this.classList.add('file-dropped');
        this.children[0].textContent = "Drag!";
        this.children[1].textContent = this.children[2].files[0].name;
        return
    }

    this.children[0].textContent = "Drop your file here";
    this.children[1].textContent = "Your .json file here";
    this.classList.add('file-drop');
}

collection_div_container.ondragenter = dragOverHandler;
collection_div_container.ondragleave = dragOverHandler;

variable_div_container.ondragenter = dragOverHandler;
variable_div_container.ondragleave = dragOverHandler;

collection_div_container.children[2].onchange = updateNamesList;
variable_div_container.children[2].onchange = updateNamesList;

collection_div_container.ondrop = dropHandler;
variable_div_container.ondrop = dropHandler;