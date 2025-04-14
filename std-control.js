import { DAQRelay } from "../reles-daq/reles-daq.js"
import { FixtureSetup } from "./web-component-setup/fixture-setup.js"

/**
 * @example
 * this.std = new SmartTestDevice(1, 3, "dc4", "dc3", "dc2", "dc1")
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
     * @param {Number} timeOut Tempo maximo em milissegundos para aguardar o movimento
     * @param {boolean} expectedState Estado esperado do sensor do limite inferior quando o movimento for considerado concluido
     * 
     * @example
     * const std = new SmartTestDevice(1, 3, "dc4", "dc3", "dc2", "dc1");
     * const result = await std.MoveDown()
     */
    async MoveDown(timeOut = 5000, expectedState = false) {
        const start = parseInt(performance.now())

        while (true) {
            const elapsedTime = parseInt(performance.now()) - start

            if (elapsedTime > timeOut) {
                DAQRelay.RemoveRelay(this.DownRelay)
                await DAQRelay.TurnOn()
                return { result: false, msg: SmartTestDevice.MOVING_TIMEOUT }
            }

            else if (this.EmergencyTriggered) {
                DAQRelay.RemoveRelay(this.DownRelay)
                await DAQRelay.TurnOn()
                return { result: false, msg: SmartTestDevice.MOVING_INTERRUPT }
            }

            else if (DAQ.in[this.BottomLimitSwitch].value === expectedState) {
                DAQRelay.RemoveRelay(this.DownRelay)
                await DAQRelay.TurnOn()
                return { result: true, msg: SmartTestDevice.MOVING_SUCESS }

            } else {
                if (DAQ.in[this.Bimanual].value) {
                    DAQRelay.AddRelay(this.DownRelay)
                    await DAQRelay.TurnOn()
                } else {
                    DAQRelay.RemoveRelay(this.DownRelay)
                    await DAQRelay.TurnOn()
                }
            }
            await SmartTestDevice.delay(50)
        }
    }

    /**
     * @param {Number} timeOut Tempo máximo em milissegundos para aguardar o movimento.
     * @param {boolean} expectedState O estado esperado do sensor do limite superior
     * quando o movimento for considerado concluído.
     *
     * @example
     * const std = new SmartTestDevice(1, 3, "dc4", "dc3", "dc2", "dc1");
     * const moveResult = await std.MoveUp();
     */
    async MoveUp(timeOut = 5000, expectedState = false) {
        const start = parseInt(performance.now())

        while (true) {
            const elapsedTime = parseInt(performance.now()) - start

            if (elapsedTime > timeOut) {
                DAQRelay.RemoveRelay(this.UpRelay)
                await DAQRelay.TurnOn()
                return { result: false, msg: SmartTestDevice.MOVING_TIMEOUT }
            }

            if (this.EmergencyTriggered) {
                DAQRelay.RemoveRelay(this.UpRelay)
                await DAQRelay.TurnOn()
                return { result: false, msg: SmartTestDevice.MOVING_INTERRUPT }
            }

            if (DAQ.in[this.TopLimitSwitch].value === expectedState) {
                DAQRelay.RemoveRelay(this.UpRelay)
                await DAQRelay.TurnOn()
                return { result: true, msg: SmartTestDevice.MOVING_SUCESS }
            } else {
                // Mantém o relé ligado enquanto o limite superior não for atingido
                DAQRelay.AddRelay(this.UpRelay)
                await DAQRelay.TurnOn()
            }

            await SmartTestDevice.delay(50)
        }
    }

    /**
     * @param {string} input O nome da entrada digital a ser observada.
     * @param {number} timeoutMs Tempo máximo em milissegundos para aguardar a mudança de estado.
     * @param {boolean} expectedStatus O nível lógico esperado (true ou false).

     * @example
     * // Espera até que o bimanual seja acionado (nível true) por até 15 segundos.
     * const biman = await this.BimanualObserver();
     */
    async BimanualObserver(input = this.Bimanual, timeoutMs = 15000, expectedStatus = true) {
        const start = parseInt(performance.now())

        if (DAQ.in[input].value === expectedStatus) { return { result: false, msg: SmartTestDevice.BIMANUAL_ALWAYS_TRIGGERED } }

        while (true) {
            const elapsedTime = parseInt(performance.now()) - start
            if (elapsedTime > timeoutMs) { return { result: false, msg: SmartTestDevice.BIMANUAL_TIMEOUT } }
            if (DAQ.in[input].value === expectedStatus) { return { result: true, msg: SmartTestDevice.BIMANUAL_TRIGGERED } }
            await SmartTestDevice.delay(50)
        }
    }

    /**
     * @param {string} input O nome da entrada digital a ser observada (chave em DAQ.in).

     * @example
     * const resultadoEmergencia = await this.EmergencyObserver();
     */
    async EmergencyObserver(input = this.Emergency) {
        if (DAQ.in[input].value === false) {
            this.EmergencyTriggered = true
            return { triggered: true, msg: SmartTestDevice.EMERGENCY_ALWAYS_TRIGGERED }
        }

        while (true) {
            if (DAQ.in[input].value === false) {
                this.EmergencyTriggered = true
                return { triggered: true, msg: SmartTestDevice.EMERGENCY_TRIGGERED }
            }

            await SmartTestDevice.delay(50)
        }
    }

    static async delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

    /**
    * Instruções para o setup do fixture superior com manípulos para alinhamento
    *
    * @param {HTMLElement} [element=document.getElementsByTagName('main')[0]] - O elemento ao qual o setup do fixture será inserido. O padrão é o primeiro elemento 'main' no document.
    * @param {string} imgAlinhamento - OPCIONAL - Uma imagem para alinhamento do fixture.
    * @param {string} msgAlinhamento - OPCIONAL - Uma mensagem para informando como fazer o alinhamento do fixture.

    * @example
    * const result = await SetupFixture();
    * console.log(result); // { result: true, msg: "instrução bem sucedida" }
    */
    async SetupFixture(element = document.getElementsByTagName('main')[0], imgAlinhamento, msgAlinhamento) {
        const Setup = new FixtureSetup(element)

        let emergencyAlwaysTriggered = false
        const emergency = Emergency(this)
        const result = await Promise.race([SetupModal(this), emergency])
        Setup.hide()
        return result

        /**
         * @param {SmartTestDevice} std 
         */
        async function Emergency(std) {
            const retornoEmergencia = await std.EmergencyObserver()
            emergencyAlwaysTriggered = true
            return { result: false, msg: retornoEmergencia.msg }
        }

        /**
         * @param {SmartTestDevice} std 
         * @return {Promise<{ result: boolean, msg: string }>}
         */
        async function SetupModal(std) {
            imgAlinhamento ??= `node_modules/@libs-scripts-mep/std-control/web-component-setup/images/encaixeAgulhas.jpeg`
            msgAlinhamento ??= `Coloque a placa no fixture, em seguida, coloque o fixture superior em cima, caso o fixture tenha agulhas, 
            alinhe o fixture de acordo com o encaixe das agulhas, como na imagem.\n\nem seguida clique em AVANÇAR ou pressione a tecla 'Enter'`

            const moveUpInitial = await std.MoveUp(8000)
            if (!moveUpInitial.result) { return moveUpInitial }

            Setup.changeInfoSpan(`⚠️ Pule esta instrução apenas se a jiga que estiver utilizando for\nalguma das bases: BS-80.1, BS-80.2 e BS-80.3. ⚠️`)

            if (emergencyAlwaysTriggered) { return { result: false, msg: SmartTestDevice.EMERGENCY_ALWAYS_TRIGGERED } }

            let modalResult = await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/Fx_inferior.jpeg`,
                `⚠️ Pule esta instrução se estiver utilizando alguma\n das bases: BS-80.1, BS-80.2 e BS-80.3. E faça o setup como normalmente. ⚠️
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
                `Certifique-se de que todos os maipulos estão paralelos ao arco e então PRESSIONE O BIMANUAL`, undefined, std.MoveDown(240000), false)
            if (!moveDown.result) { return moveDown }

            await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/ajustaComFixture.gif`,
                `Ajuste todos os manipulos para que prendam o fixture superior,\n para fazer isso pressione o manipulo pra baixo e gire no sentido horario, como no gif.
                \n\nquando o fixture superior estiver preso, clique em AVANÇAR ou pressione a tecla 'Enter'`)

            const moveUp = await std.MoveUp(10000)
            if (!moveUp.result) { return moveUp }

            return { result: true, msg: `instrução bem sucedida` }
        }
    }
}