import { randomUUID } from 'crypto';
import fs, { read } from 'fs'
import process from 'process';

export class CollectionReader {

    title = ''

    HTML_raw = ''
    README_raw = ''

    collections = []
    debug = false

    cssMinified = ''

    constructor(debug = false) {
        this.debug = debug
        this.cssMinified = fs.readFileSync(process.cwd() + '/src/public/dist/documentation_light.css').toString();
    }

    read(path) {
        try {
            return fs.readFileSync(process.cwd() + "/Sample Data/" + path).toString()
        }
        catch (e) {
            console.log("Something went wrong attemping read your document...")
            console.log(process.cwd() + "/src/" + path)
        }
    }

    analize(rawInfo) {
        let infoParsed = JSON.parse(rawInfo)
        this.title = infoParsed["info"]["name"]
        this.description = infoParsed["info"]["description"] ? infoParsed["info"]["description"].split("\n    \n\n").join("\n\n") : '';
        this.collections = infoParsed["item"]
    }

    saveReadme() {
        this.README_raw = '<!-- Postman - DocGenerator ---->\n\n'
        if (this.title === null) { console.log("impossible to complete this"); return; }
        this.README_raw += `# ${this.title} - API Documentation\n`
        this.README_raw += this.description
        fs.writeFileSync(process.cwd() + "/src/README-Generated.md", this.README_raw)
    }

    saveHTML() {
        const uniqueName = this.debug ? "testo" : randomUUID()

        this.HTML_raw = '<!-- \nPostman - DocGenerator\nAutomatically generated document\n---->\n'
        if (this.title === null) { console.log("impossible to complete this"); return; }

        this.HTML_raw += `<head><title>${this.title} - API Reference</title>`
        this.HTML_raw += this.debug ? '<link rel="stylesheet" href="../css/documentation_light.css">' : `<style>${this.cssMinified}</style>`
        this.HTML_raw += '</head><body>'
        this.HTML_raw += `<main><div class="top" onclick="scrollToTop()">⬆️ Back to top</div><h1 class="collection-title">${this.title} <span>API Reference</span></h1>`
        this.HTML_raw += this.description ? `<div class="collection-description">${this.__HTML_Tokenizer(this.description)}</div>` : ''
        this.HTML_raw += this.__writeHTMLCollections(this.collections) + "</main>";
        this.HTML_raw += '</body>'
        this.HTML_raw += `<script> function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); } </script>`
        fs.writeFileSync(process.cwd() + `/src/public/generated/${uniqueName}.html`, this.HTML_raw)
        return uniqueName
    }

    __HTML_Tokenizer(rawReadmeTemplate) {
        let result = rawReadmeTemplate
        let list = ''
        let table = ''
        let isInTable = [false, false, false] // "stillInTable", "tableReadyToRender", "isHeaderAdded"
        let isInList = [false, false] // "stillInList", "listReadyToRender"
        let isInOrderedList = [false, false] // "stillInList", "listReadyToRender"

        result = result.split("\n").map((line, index, original) => {
            let currentLine = line
            if (currentLine === "") return;

            currentLine = currentLine
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\[(.*?)\]\((.*?)\)/g, "<a target='_blank' href='$2'>$1</a>")
                .replace(/\~\~(.*?)\~\~/g, "<del>$1</del>")
                .replace(/\`(.*?)\`/g, "<code>$1</code>")
                .replace(/\_(.*?)\_/g, "<em>$1</em>")
                .replace("<b>", "<strong>")
                .replace("</b>", "</strong>")

            let matchGato = currentLine.match(/^#+/)
            if (matchGato) {
                if (matchGato.length <= 6) {
                    currentLine = `<h${matchGato.length + 1}> ${currentLine.replace(new RegExp(`^#{1,${matchGato.length + 1}}\\s*`), '')} </h${matchGato.length + 1}>`

                }
            }

            if (/^[-*+]/.test(currentLine) && !isInList[0]) {
                list += '<ul>'
                isInList = [true, false]
            }

            if (/^[-*+]/.test(currentLine) && isInList[0]) {
                list += currentLine.replace(/^([+\-*])\s(.+)$/gm, "<li>$2</li>")
                return
            }

            if (!(/^[-*+]/.test(currentLine)) && isInList[0]) {
                list += `</ul>`
                isInList = [false, true]
            }

            //---
            if (/^\d+\.\s/.test(currentLine) && !isInOrderedList[0]) {
                list += '<ol>'
                isInOrderedList = [true, false]
            }

            if (/^\d+\.\s/.test(currentLine) && isInOrderedList[0]) {
                list += currentLine.replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>")
                return
            }

            if (!(/^\d+\.\s/.test(currentLine)) && isInOrderedList[0]) {
                list += `</ol>`
                isInOrderedList = [false, true]
            }

            var matches = currentLine.match(/\|/g);

            if (matches && !isInTable[0]) {
                table += `<table><tbody><tr>`
                table += currentLine.split("|").map((segment) => {
                    if (segment === "") return
                    return `<th>${segment}</th>`
                }).join("")
                table += `</tr>`
                isInTable = [true, false]
                return
            }

            if (matches && isInTable[0]) {
                let toIntegrate = currentLine.split("|").map((segment) => {
                    if (segment === "") return
                    if (/--+/.test(segment)) return
                    return `<td>${segment}</td>`
                }).join("")
                if (toIntegrate.trim() === "") return
                table += `<tr>`
                table += toIntegrate
                table += `</tr>`
                if (!(index + 1 === original.length)) return
            }

            if ((!matches && isInTable[0]) || (index + 1 === original.length)) {
                table += `</tbody></table>`
                isInTable = [false, true]
                if ((index + 1 === original.length)) return table
            }

            if (isInList[1] || isInOrderedList[1]) {
                isInList[1] = false;
                isInOrderedList[1] = false;
                currentLine = list + `<p>${currentLine}</p>`;
                list = ''
            } else if (isInTable[1]) {
                isInTable[1] = false
                currentLine = table + `<p>${currentLine}</p>`;
                table = ''
            } else {
                currentLine = `<p>${currentLine}</p>`;
            }

            return currentLine
        }).join("")


        return result
    }


    __writeHTMLCollections(collection) {
        let response = ''

        for (let key in collection) {
            const me = collection[key]
            response += `<hr class="folder-separator"><h1 class="folder-title">${me.name}<span>Collection</span></h1>`
            response += me.description ? `<p class="collection-description">${me.description}</p>` : ''
            response += this.__writeRequestExamples(me.item)
        }

        return response
    }

    __writeRequestExamples(requests) {
        let response = ''
        for (let key in requests) {
            const current = requests[key]
            response += '<hr class="requests-separator">'
            response += `<h2 class="request-title">${current.name} <span class="badge ${current.request["method"].toLowerCase()}">${current.request["method"]}</span></h2>`
            const data = current["request"]["body"] ? current["request"]["body"]["raw"] ?
                this.__readCommentAndDecode(current["request"]["body"]["raw"]) :
                '' : ''
            response += data["description"] ? `<p>${data["description"]}</p>` : ""
            response += `<div class="uri-container"><h2 class="uri-header">Base URL</h2><code class="uri">${current.request.url.raw ? current.request.url.raw : "Not defined"}</code></div>`
            response += data["raw"] ? this.__rawCodedProcessAsCodeToRender(data["raw"]) : ''
            response += data["params"] ? this.__objectToHTML(data["params"]) : ''
        }
        return response
    }

    __rawCodedProcessAsCodeToRender(string) {
        let response = '<code class="json-body">';
        response += "<h1>Request Body</h1>"

        response += string.split("\n").map((line) => {
            if (line.trim() === "") return
            const ident = line.match(/^ */)
            const newLine = line
            .replace(/"([^"]+)":\s*"([^"]+)"/g, `<span class="key-json">"$1"</span>:<span class="value-json">"$2"</span>`)
            .replace(/"([^"]+)"\s*:\s*(\d+(\.\d+)?)\s*/g, '<span class="key-json">"$1"</span>: <span class="number-json">$2</span>')
            .replace(/"([^"]+)":\s*\[([^]]+)\]/g, '<span class="key-json">$1</span>: [<span class="number-json">$2</span>]')
            .replace(/"([^"]+)":(\[.*?\])/g, '<span class="key-json">"$1"</span>:$2')
            .replace(/(\d+\.\d+)/g, '<span class="number-json">$1</span>')
                .replace(/"([^"]+)":\s*{/g, `<span class="key-json">"$1"</span>:{`).trim()
            return `<p  style="margin-left: ${ident[0].length * 8}px;">${newLine} </p>`
        }).join("")

        response += "</code>"
        return response
    }

    __objectToHTML(object, isChild = false) {
        let response = ''
        for (let key in object) {
            let extra = false
            let hadChild = typeof object[key].value === 'object'
            let suggestions = ''

            if (hadChild) {
                extra = this.__objectToHTML(object[key].value, true)
            }

            if (object[key].suggest.length) {
                suggestions = '<div class="suggestions">'
                suggestions += '<h1 class="suggestions">Posibles valores: </h1>'
                suggestions += object[key].suggest.map((data) => {
                    return `<span class="possibilities">${data}</span>`
                }).join("")
                suggestions += '</div>'
            }

            response += `<div class="${isChild ? "req-body-child" : "req-body"}">`
            response += `<h3 class="req-title">${key}`
            response += `${object[key].type ? `<span class="req-tipo">${object[key].type}</span>` : ""}`
            response += `${isChild ? '<span class="child-req">child</span>' : ""}`
            response += `</h3>`
            response += `${object[key].description ? `<p class="req-description">${object[key].description}</p>` : ''}`
            response += suggestions ? suggestions : ""
            if (hadChild) {
                response += `<details>`
                response += `<summary>See childs`
                response += `</summary>`
                response += extra ? extra : '';
                response += `</details>`
            }
            response += `</div>`

        }
        return response
    }

    /**
     * Esta es el método principal del analizador de comentarios.
     * @param {string} rawBody - Raw .json info with comments as documentation and type
     * @returns 
     */
    __readCommentAndDecode(rawBody) {
        let response = {}

        var valores = rawBody.match(/\/\*\s*([\s\S]*?)\s*\*\//);

        if (valores && valores.length > 1) {
            response["description"] = valores[1]; // Retorna todo lo que está dentro "/* */". Como descripción
        } else {
            response["description"] = ''
        }
        const items = this.__parseBody(rawBody.replace(/\/\*\s*([\s\S]*?)\s*\*\//, ''))
        response["params"] = items;
        response["raw"] = rawBody.replace(/\/\*\s*([\s\S]*?)\s*\*\//, '').replace(/\/\/.*/g, '')

        return response
    }

    /**
     * Lee línea por línea y hace un análisis profundo del objeto en string
     * @param {string} rawBody - Body raw (JSON) sin los comentarios /* 
     * @returns 
     */
    __parseBody(rawBody) {
        const lines = rawBody.trim().split("\n") // El documento dividido por líneas
        let response = {} // La respuesta que será entregada
        let scope = ["global"]
        let stack = []

        lines.forEach((line) => {
            let twoSegment = line.split(":") // "algo":"algo2" -> [algo,algo2]}

            if (twoSegment.length > 1) {


                if (typeof stack[scope[scope.length - 1]] === 'undefined') {
                    stack[scope[scope.length - 1]] = []
                }

                stack[scope[scope.length - 1]].push({ 'key': twoSegment[0].trim().replace(/"/g, ""), "info": this.__decodeValueAndComment(twoSegment[1].trim()) })

                if (twoSegment[1].includes("{")) {
                    scope.push(twoSegment[0].trim().replace(/"/g, ""))
                }

            } else if (line.trim().includes("}")) {
                let scopeRemoved = scope.pop()
                if (scopeRemoved !== "global") {
                    for (let key in stack[scope[scope.length - 1]]) {
                        if (stack[scope[scope.length - 1]][key].key === scopeRemoved) {
                            stack[scope[scope.length - 1]][key].info.value = stack[scopeRemoved]
                            delete stack[scopeRemoved]
                        }
                    }
                }
            }
        })
        response = this.__stackToResponse(stack["global"])
        return response
    }

    /**
     * Return an Object with correct format from a stack list :)
     * @param {*} stackArray - Stack
     */
    __stackToResponse(stackArray) {
        const response = {}
        if (stackArray === null) return
        stackArray.map((element) => {
            let value = element.info.value
            if (typeof value === 'object') {
                value = this.__stackToResponse(value)
            }
            response[element.key] = {
                value: value,
                type: element.info.type,
                description: element.info.description,
                suggest: element.info.suggest
            }
        })

        return response
    }

    /**
     * 
     * @param {string} lineAndComment - Línea de json
     * @returns - Tipo, valor, descripcion y sugerencias de uso según los comentarios y datos dados
     */
    __decodeValueAndComment(lineAndComment) {

        const type = lineAndComment.match(/<([^>]+)>/) ?
            lineAndComment.match(/<([^>]+)>/)[1]
            : null

        const value = lineAndComment.includes("{") ? "<-REF->" :
            lineAndComment.match(/"([^"]+)"/) ? lineAndComment.match(/"([^"]+)"/)[1] : null

        let mach = lineAndComment.match(/-([^|-]+)/)
        let evalmach = mach ? /^[^A-Za-z]*$/.test(mach[1].trim()) : false

        const description = lineAndComment.match(/-([^|]+)\s*\|/) ? lineAndComment.match(/-([^|]+)\s*\|/)[1].trim() :
            mach && !evalmach ? lineAndComment.match(/-([^|-]+)/)[1].trim() : null;

        let suggest = []

        if (lineAndComment.match(/\|\s*(.+)\s*$/)) {
            suggest = lineAndComment.match(/\|\s*(.+)\s*$/)[1].split(',').map(item => item.trim().replace(/(^"|"$)/g, ''));
        }

        const result = {
            value: value,
            type: type,
            description: description,
            suggest: suggest
        }

        return result;
    }
}