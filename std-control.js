class SmartTestDevice {
    /**
     * 
     * @param {Array} UpRelay array contendo o rele responsavel por fazer a base subir o motor
     * @param {Array} DownRelay array contendo o rele responsavel por fazer a base descer o motor
     * @param {string} TopLimitSwitch string informando a entrada relacionada ao fim de curso superior
     * @param {string} BottomLimitSwitch string informando a entrada relacionada ao fim de curso inferior
     * @param {string} Bimanual string informando a entrada relacionada ao Bimanual
     * @param {string} Emergency string informando a entrada relacionada a Emergency
     */
    constructor(upRelay, downRelay, topLimitSwitch, bottomLimitSwitch, bimanual, emergency) {
        this.BottomLimitSwitch = bottomLimitSwitch
        this.TopLimitSwitch = topLimitSwitch
        this.Emergency = emergency
        this.DownRelay = downRelay
        this.UpRelay = upRelay
        this.Bimanual = bimanual
        this.EmergencyTriggered = false
    }

    static MOVING_TIMEOUT = "Motor demorou para chegar ao destino"
    static MOVING_SUCESS = "Motor atuou como esperado"
    static MOVING_INTERRUPT = "Movimentação do motor interrompida!"

    static BIMANUAL_TIMEOUT = "Bimanual não detectado dentro do tempo esperado"
    static BIMANUAL_TRIGGERED = "Entrada bimanual detectada"
    static BIMANUAL_ALWAYS_TRIGGERED = "Entrada bimanual sempre acionada"

    static EMERGENCY_TRIGGERED = "Emergência acionada!"
    static EMERGENCY_ALWAYS_TRIGGERED = "Emergência sempre acionada!"

    async MoveDown(timeOut = 5000, expectedLevel = false) {

        return new Promise((resolve) => {

            let awaitsMoving = setInterval(() => {
                if (this.EmergencyTriggered) {

                    clearInterval(awaitsMoving)
                    clearTimeout(movingTimeOut)
                    pvi.daq.desligaRele(this.UpRelay)
                    resolve({ result: false, msg: SmartTestDevice.MOVING_INTERRUPT })

                } else if (pvi.daq.in[this.BottomLimitSwitch].value == expectedLevel) {
                    clearInterval(awaitsMoving)
                    clearTimeout(movingTimeOut)
                    pvi.daq.desligaRele(this.DownRelay)
                    resolve({ result: true, msg: SmartTestDevice.MOVING_SUCESS })

                } else {
                    if (pvi.daq.in[this.Bimanual].value == true) {
                        pvi.daq.ligaRele(this.DownRelay)
                    } else {
                        pvi.daq.desligaRele(this.DownRelay)
                    }
                }
            }, 100)

            let movingTimeOut = setTimeout(() => {
                clearInterval(awaitsMoving)
                pvi.daq.desligaRele(this.DownRelay)
                resolve({ result: false, msg: SmartTestDevice.MOVING_TIMEOUT })
            }, timeOut)
        })

    }

    async MoveUp(timeOut = 5000, expectedLevel = false) {

        return new Promise((resolve) => {
            let awaitsMoving = setInterval(() => {
                if (this.EmergencyTriggered) {

                    clearInterval(awaitsMoving)
                    clearTimeout(movingTimeOut)
                    pvi.daq.desligaRele(this.UpRelay)
                    resolve({ result: false, msg: SmartTestDevice.MOVING_INTERRUPT })

                } else if (pvi.daq.in[this.TopLimitSwitch].value == expectedLevel) {

                    clearInterval(awaitsMoving)
                    clearTimeout(movingTimeOut)

                    pvi.daq.desligaRele(this.UpRelay)
                    resolve({ result: true, msg: SmartTestDevice.MOVING_SUCESS })
                } else {
                    pvi.daq.ligaRele(this.UpRelay)
                }
            }, 100)

            let movingTimeOut = setTimeout(() => {
                clearInterval(awaitsMoving)
                pvi.daq.desligaRele(this.UpRelay)
                resolve({ result: false, msg: SmartTestDevice.MOVING_TIMEOUT })
            }, timeOut)
        })
    }

    async BimanualObserver(input = this.Bimanual, timeout = 15000, expectedLevel = true) {
        return new Promise((resolve) => {
            if (pvi.daq.in[input].value == !expectedLevel) {

                pvi.daq.in[input].onChange = (logicLevel) => {
                    if (logicLevel == expectedLevel) {
                        clearTimeout(timeOutMonitor)
                        resolve({ result: true, msg: SmartTestDevice.BIMANUAL_TRIGGERED })
                    }
                }
            } else {
                resolve({ result: false, msg: SmartTestDevice.BIMANUAL_ALWAYS_TRIGGERED })
            }

            const timeOutMonitor = setTimeout(() => {
                pvi.daq.in[input].onChange = () => { }
                resolve({ result: false, msg: SmartTestDevice.BIMANUAL_TIMEOUT })
            }, timeout)
        })
    }

    async EmergencyObserver(input = this.Emergency) {
        return new Promise((resolve) => {
            if (pvi.daq.in[input].value == true) {
                pvi.daq.in[input].onChange = (logicLevel) => {
                    if (logicLevel == false) {
                        this.EmergencyTriggered = true
                        resolve({ triggered: true, msg: SmartTestDevice.EMERGENCY_TRIGGERED })
                    }
                }
            } else {
                resolve({ triggered: false, msg: SmartTestDevice.EMERGENCY_ALWAYS_TRIGGERED })
            }
        })
    }


    /**
    * Instruções para o setup do fixture superior da nova revisão mecânica
    *
    * @param {HTMLElement} [element=document.getElementsByTagName('main')[0]] - O elemento ao qual o setup do fixture será anexado. O padrão é o primeiro elemento 'main' no document.
    * @return {Promise<Object>} Um objeto com o resultado da configuração e uma mensagem.
    *   - result: Um booleano indicando o sucesso da configuração.
    *   - msg: Uma mensagem em string descrevendo o resultado da configuração.
    *
    * @example
    * const result = await SetupFixture();
    * console.log(result); // { result: true, msg: "instrução bem sucedida" }
    */
async SetupFixture(element = document.getElementsByTagName('main')[0]) {

    // this.adicionaScript()
    const Setup = new FixtureSetup(element)
    window.testeSetupFixture = Setup
    let emergencyAlwaysTriggered = false
    const emergency = Emergency(this)
    const result = await Promise.race([SetupModal(this), emergency])
    Setup.hide()
    return result

    async function Emergency(context) {
        const retornoEmergencia = await context.EmergencyObserver()
        emergencyAlwaysTriggered = true
        return { result: false, msg: retornoEmergencia.msg }
    }

    async function SetupModal(context) {

        const moveUpInitial = await context.MoveUp(8000)
        if (!moveUpInitial.result) { return moveUpInitial }

        Setup.changeInfoSpan(`⚠️ Pule esta instrução apenas se a jiga que estiver utilizando for\nalguma das jigas: BS-80.1, BS-80.2 e BS-80.3. ⚠️`)

        if (emergencyAlwaysTriggered) { return }

        let modalResult = await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/Fx_inferior.jpeg`,
            `⚠️ Pule esta instrução se a jiga que estiver utilizando for alguma\n das jigas: BS-80.1, BS-80.2 e BS-80.3. E faça o setup como normalmente. ⚠️
            \n\n Coloque o fixture inferior na base.\n\nem seguida clique em AVANÇAR ou pressione a tecla 'Enter'`)
        if (modalResult == "skip") { return { result: true, msg: `Jiga com revisão antiga` } }

        modalResult = await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/ajustaManipulo.gif`,
            `Ajuste todos os manipulos para que fiquem paralelos ao arco,\n para fazer isso pressione o manipulo pra baixo e gire no sentido anti-horario, como no gif.
            \n\nem seguida clique em AVANÇAR ou pressione a tecla 'Enter'`)
        if (modalResult == "skip") { return { result: true, msg: `Jiga com revisão antiga` } }

        modalResult = await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/encaixeAgulhas.jpeg`,
            `Coloque a placa no fixture, em seguida, coloque o fixture superior em cima, caso o fixture tenha agulhas, alinhe os fixtures de acordo com o encaixe das agulhas, 
             como na imagem.\n\nem seguida clique em AVANÇAR ou pressione a tecla 'Enter'`)
        if (modalResult == "skip") { return { result: true, msg: `Jiga com revisão antiga` } }

        Setup.hideDivButtonSkip()

        const moveDown = await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/manipulosPosicao.jpeg`,
            `Certifique-se de que todos os maipulos estão paralelos ao arco e então PRESSIONE O BIMANUAL`, undefined, context.MoveDown(240000), false)
        if (!moveDown.result) { return moveDown }

        await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/ajustaComFixture.gif`,
            `Ajuste todos os manipulos para que prendam o fixture superior,\n para fazer isso pressione o manipulo pra baixo e gire no sentido horario, como no gif.
            \n\nquando o fixture superior estiver preso, clique em AVANÇAR ou pressione a tecla 'Enter'`)

        const moveUp = await context.MoveUp(10000)
        if (!moveUp.result) { return moveUp }

        return { result: true, msg: `instrução bem sucedida` }
    }
}
}