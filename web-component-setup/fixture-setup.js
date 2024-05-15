

class FixtureSetup extends HTMLElement {
    constructor(fatherElement) {
        super()
        this.fatherElement = fatherElement
        this.build()
    }

    build() {
        this.attachShadow({ mode: "open" })
        this.shadowRoot.innerHTML = /*html*/`
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/siimple@3.3.1/dist/siimple.min.css">
        <link rel="stylesheet" href="node_modules/@libs-scripts-mep/std-control/web-component-setup/fixture-setup.css">

        <div class="siimple-modal siimple-modal--small" id="html_modalDark">
        <div class="siimple-modal-content" id="html_modalDarkContent">
            <img src="node_modules/@libs-scripts-mep/std-control/web-component-setup/images/logo_n.png" class="logoInovaContainers">
            <div id="textTitle_modalDark">instrução setup de fixture superior</div>
            <div id="html_modalDarkDisplay" class="siimple-modal-body">
                <img id="html_modalDarkImg" class="siimple-grid-col siimple-grid-col--12" src="node_modules/@libs-scripts-mep/std-control/web-component-setup/images/padrao.png"
                    style>
            </div>
            <div id="textInformation_modalDark"></div>
            <div class = "divButtons" id = "divButtons">            
                <div id="divButtonSkip"  title = "" class = "divButtons" >
                    <input type="submit" class="buttonStyle" id="buttonSkip" value="⚠️ Pular instruções">
                </div>
            <input type="submit" class="buttonStyle" id="buttonAdvance" value="Avançar">
            </div>
        
        </div>
        </div>
        `

        this.fatherElement.appendChild(this)
        this.hidden = true
    }


    show() { return this.hidden = false }

    hide() { return this.hidden = true }

    hideButtons() { return this.shadowRoot.getElementById("divButtons").style.display = "none" }

    showButtons() { return this.shadowRoot.getElementById("divButtons").style.display = "" }

    hideDivButtonSkip() { return this.shadowRoot.getElementById("divButtonSkip").style.display = "none" }

    changeInfoSpan(text = "") { return this.shadowRoot.getElementById("divButtonSkip").title = text }

    async onKeyDown(expectedKey, toReturnValue) {
        return new Promise((resolve) => {
            document.addEventListener('keydown', (key) => {
                if (key.code == expectedKey) {
                    resolve(toReturnValue)
                }
            })
        })
    }

    async onClick(element, toReturnValue) {
        return new Promise((resolve) => {
            element.addEventListener('click', () => {
                resolve(toReturnValue)
            }, { once: true })
        })
    }

    /**
     * Asynchronously displays a dark modal with an image, title, and message.
     *
     * @param {string} img - The URL of the image to display in the modal.
     * @param {string} [msg=""] - The message to display in the modal.
     * @param {string|null} [tittle=null] - The title to display in the modal.
     * @param {Promise} externalTrigger - A promise that resolves when the modal should be closed.
     * @param {boolean} [showButtons=true] - Whether to show the buttons in the modal.
     * @return {Promise} A promise that resolves when the modal is closed. 
     */
    async modalDark(img, msg = "", tittle = null, externalTrigger = new Promise(() => { }), showButtons = true) {

        const textTitle_modalDark = this.shadowRoot.getElementById("textTitle_modalDark")
        const html_modalDarkImg = this.shadowRoot.getElementById("html_modalDarkImg")
        const textInformation_modalDark = this.shadowRoot.getElementById("textInformation_modalDark")
        const buttonAdvance = this.shadowRoot.getElementById('buttonAdvance')
        const buttonSkip = this.shadowRoot.getElementById('buttonSkip')

        html_modalDarkImg.src = img
        tittle != null ? textTitle_modalDark.innerText = tittle : null
        textInformation_modalDark.innerText = msg

        await this.waitToRender(300)

        this.show()
        let winner
        if (showButtons) {
            this.showButtons()
            const ClickAdvanc = this.onClick(buttonAdvance, true)
            const ClickSkip = this.onClick(buttonSkip, "skip")
            const NumEnter = this.onKeyDown("NumpadEnter", true)
            const Space = this.onKeyDown("Space", true)
            const Enter = this.onKeyDown("Enter", true)
            winner = await Promise.race([ClickAdvanc, ClickSkip, Enter, NumEnter, Space, externalTrigger])
        } else { 
            this.hideButtons() 
            winner = await externalTrigger
        }

        this.hide()
        return winner
    }
    async waitToRender(delay = 10) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, delay)
        })
    }
}

customElements.define("fixture-setup", FixtureSetup)
