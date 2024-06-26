import { FixtureSetup } from "./web-component-setup/fixture-setup.js"
/**
 * # Exemplos
 * 
 * ```js
 * this.Std = new SmartTestDevice(1, 3, "dc4", "dc3", "dc2", "dc1")
 * ```
 */
export default class SmartTestDevice {
    constructor(upRelay, downRelay, topLimitSwitch, bottomLimitSwitch, bimanual, emergency) {
        /**Entrada do DAQ referente ao acionamento da microchave que detecta o limite `inferior` da movimentação do motor */
        this.BottomLimitSwitch = bottomLimitSwitch
        /**Entrada do DAQ referente ao acionamento da microchave que detecta o limite `superior` da movimentação do motor */
        this.TopLimitSwitch = topLimitSwitch
        /**Entrada do DAQ referente ao botão de `emergência`*/
        this.Emergency = emergency
        /**Relé do DAQ referente ao comando de `descida` do motor*/
        this.DownRelay = downRelay
        /**Relé do DAQ referente ao comando de `subida` do motor*/
        this.UpRelay = upRelay
        /**Entrada do DAQ referente aos botões de comando `bimanual`*/
        this.Bimanual = bimanual
        /**Flag que disponibiliza status de acionamento do botão de `emergência`*/
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

    /**
     * 
     * @param {Number} timeOut 
     * @param {Boolean} expectedLevel 
     * @returns Object
     * 
     * # Exemplos
     * 
     * ```js
     * this.Std = new SmartTestDevice(1, 3, "dc4", "dc3", "dc2", "dc1")
     * const result = await this.Std.MoveDown()
     * ```
     * 
     * ## Result
     * 
     * ```js
     * {result: Boolean, msg: String}
     * ```
     */
    async MoveDown(timeOut = 5000, expectedLevel = false) {

        return new Promise((resolve) => {

            let awaitsMoving = setInterval(() => {
                if (this.EmergencyTriggered) {

                    clearInterval(awaitsMoving)
                    clearTimeout(movingTimeOut)
                    DAQ.desligaRele(this.UpRelay)
                    resolve({ result: false, msg: SmartTestDevice.MOVING_INTERRUPT })

                } else if (DAQ.in[this.BottomLimitSwitch].value == expectedLevel) {
                    clearInterval(awaitsMoving)
                    clearTimeout(movingTimeOut)
                    DAQ.desligaRele(this.DownRelay)
                    resolve({ result: true, msg: SmartTestDevice.MOVING_SUCESS })

                } else {
                    if (DAQ.in[this.Bimanual].value == true) {
                        DAQ.ligaRele(this.DownRelay)
                    } else {
                        DAQ.desligaRele(this.DownRelay)
                    }
                }
            }, 100)

            let movingTimeOut = setTimeout(() => {
                clearInterval(awaitsMoving)
                DAQ.desligaRele(this.DownRelay)
                resolve({ result: false, msg: SmartTestDevice.MOVING_TIMEOUT })
            }, timeOut)
        })

    }

    /**
     * 
     * @param {Number} timeOut 
     * @param {Boolean} expectedLevel 
     * @returns Object
     * 
     * # Exemplos
     * 
     * ```js
     * this.Std = new SmartTestDevice(1, 3, "dc4", "dc3", "dc2", "dc1")
     * const result = await this.Std.MoveUp()
     * ```
     * 
     * ## Result
     * 
     * ```js
     * {result: Boolean, msg: String}
     * ```
     */
    async MoveUp(timeOut = 5000, expectedLevel = false) {

        return new Promise((resolve) => {
            let awaitsMoving = setInterval(() => {
                if (this.EmergencyTriggered) {

                    clearInterval(awaitsMoving)
                    clearTimeout(movingTimeOut)
                    DAQ.desligaRele(this.UpRelay)
                    resolve({ result: false, msg: SmartTestDevice.MOVING_INTERRUPT })

                } else if (DAQ.in[this.TopLimitSwitch].value == expectedLevel) {

                    clearInterval(awaitsMoving)
                    clearTimeout(movingTimeOut)

                    DAQ.desligaRele(this.UpRelay)
                    resolve({ result: true, msg: SmartTestDevice.MOVING_SUCESS })
                } else {
                    DAQ.ligaRele(this.UpRelay)
                }
            }, 100)

            let movingTimeOut = setTimeout(() => {
                clearInterval(awaitsMoving)
                DAQ.desligaRele(this.UpRelay)
                resolve({ result: false, msg: SmartTestDevice.MOVING_TIMEOUT })
            }, timeOut)
        })
    }

    /**
     * 
     * @param {String} input 
     * @param {Number} timeOut 
     * @param {Boolean} expectedLevel
     * @returns Object
     * 
     * # Exemplos
     * 
     * ## Utilizando parâmetros default
     * 
     * ```js
     * this.Std = new SmartTestDevice(1, 3, "dc4", "dc3", "dc2", "dc1")
     * const result = await this.Std.BimanualObserver()
     * ```
     * 
     * ## Utilizando parâmetros personalizados
     * 
     * Passa 5000 para `timeout`, mantendo o valor default para `input` e `expecctedLevel`:
     * ```js
     * const result = await this.Std.BimanualObserver(undefined, 5000)
     * ```
     * 
     * ## Result
     * 
     * ```js
     * {result: Boolean, msg: String}
     * ```
     */
    async BimanualObserver(input = this.Bimanual, timeout = 15000, expectedLevel = true) {
        return new Promise((resolve) => {
            if (DAQ.in[input].value == !expectedLevel) {

                DAQ.in[input].onChange = (logicLevel) => {
                    if (logicLevel == expectedLevel) {
                        clearTimeout(timeOutMonitor)
                        resolve({ result: true, msg: SmartTestDevice.BIMANUAL_TRIGGERED })
                    }
                }
            } else {
                resolve({ result: false, msg: SmartTestDevice.BIMANUAL_ALWAYS_TRIGGERED })
            }

            const timeOutMonitor = setTimeout(() => {
                DAQ.in[input].onChange = () => { }
                resolve({ result: false, msg: SmartTestDevice.BIMANUAL_TIMEOUT })
            }, timeout)
        })
    }

    /**
     * 
     * @param {Number} input 
     * @returns Object
     * 
     * # Exemplos
     * 
     * Utilizando parâmetros default:
     * 
     * ```js
     * this.Std = new SmartTestDevice(1, 3, "dc4", "dc3", "dc2", "dc1")
     * const result = await this.Std.EmergencyObserver()
     * ```
     * 
     * ## Result
     * 
     * ```js
     * {result: Boolean, msg: String}
     * ```
     */
    async EmergencyObserver(input = this.Emergency) {
        return new Promise((resolve) => {
            if (DAQ.in[input].value == true) {
                DAQ.in[input].onChange = (logicLevel) => {
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
    * @param {string} imgAlinhamento - OPCIONAL - Uma imagem para alinhamento do fixture.
    * @param {string} msgAlinhamento - OPCIONAL - Uma mensagem para informando como fazer o alinhamento do fixture.
    * @return {Promise<Object>} Um objeto com o resultado da configuração e uma mensagem.
    *   - result: Um booleano indicando o sucesso da configuração.
    *   - msg: Uma mensagem em string descrevendo o resultado da configuração.
    *
    * @example
    * const result = await SetupFixture();
    * console.log(result); // { result: true, msg: "instrução bem sucedida" }
   */
    async SetupFixture(element = document.getElementsByTagName('main')[0], imgAlinhamento, msgAlinhamento) {
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
            imgAlinhamento ??= `node_modules/@libs-scripts-mep/std-control/web-component-setup/images/encaixeAgulhas.jpeg`
            msgAlinhamento ??= `Coloque a placa no fixture, em seguida, coloque o fixture superior em cima, caso o fixture tenha agulhas, 
            alinhe o fixture de acordo com o encaixe das agulhas, como na imagem.\n\nem seguida clique em AVANÇAR ou pressione a tecla 'Enter'`

            const moveUpInitial = await context.MoveUp(8000)
            if (!moveUpInitial.result) { return moveUpInitial }

            Setup.changeInfoSpan(`⚠️ Pule esta instrução apenas se a jiga que estiver utilizando for\nalguma das jigas: BS-80.1, BS-80.2 e BS-80.3. ⚠️`)

            if (emergencyAlwaysTriggered) { return }

            let modalResult = await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/Fx_inferior.jpeg`,
                `⚠️ Pule esta instrução se estiver utilizando alguma\n das jigas: BS-80.1, BS-80.2 e BS-80.3. E faça o setup como normalmente. ⚠️
                \n Coloque o fixture inferior na base.\n em seguida clique em AVANÇAR ou pressione a tecla 'Enter'`)
            if (modalResult == "skip") { return { result: true, msg: `Jiga com revisão antiga` } }

            modalResult = await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/ajustaManipulo.gif`,
                `Ajuste todos os manipulos para que fiquem paralelos ao arco,\n para fazer isso pressione o manipulo pra baixo e gire no sentido anti-horario, como no gif.
                \n\nem seguida clique em AVANÇAR ou pressione a tecla 'Enter'`)
            if (modalResult == "skip") { return { result: true, msg: `Jiga com revisão antiga` } }

            modalResult = await Setup.modalDark(imgAlinhamento, msgAlinhamento)
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