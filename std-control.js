import Relays from "../reles-daq/relays.js"
import { DAQ } from "../daq-fwlink/DAQ.js"
import { FixtureSetup } from "./web-component-setup/fixture-setup.js"

export default class SmartTestDevice {

    static hardware = {
        upRelay: 1,
        downRelay: 3,
        emergency: "dc1",
        bimanual: "dc2",
        bottomLimitSwitch: "dc3",
        topLimitSwitch: "dc4"
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
     * Move o motor para baixo enquanto o bimanual estiver acionado
     * @param {number} timeout 
     * @param {boolean} expectedState 
     */
    static async moveDown(timeout = 5000, expectedState = false) {
        let loopControl = true
        setTimeout(() => loopControl = false, timeout)

        while (loopControl) {
            if (DAQ.in[this.hardware.bottomLimitSwitch].value === expectedState) return { result: true, msg: SmartTestDevice.MOVING_SUCESS }

            if (!DAQ.in[this.hardware.emergency].value) return { result: false, msg: SmartTestDevice.MOVING_INTERRUPT }

            while (loopControl && DAQ.in[this.hardware.emergency].value && DAQ.in[this.hardware.bimanual].value && DAQ.in[this.hardware.bottomLimitSwitch].value !== expectedState) {
                if (!Relays.enabledRelays.has(this.hardware.downRelay)) await Relays.enable(this.hardware.downRelay)
                await this.delay(50)
            }

            if (Relays.enabledRelays.has(this.hardware.downRelay)) await Relays.disable(this.hardware.downRelay)
            await this.delay(50)
        }

        return { result: false, msg: SmartTestDevice.MOVING_TIMEOUT }
    }

    /**
     * Move o motor para cima enquanto
     * @param {number} timeout 
     * @param {boolean} expectedState
    */
    static async moveUp(timeout = 5000, expectedState = false) {
        let loopControl = true
        setTimeout(() => loopControl = false, timeout)

        while (loopControl) {
            if (DAQ.in[this.hardware.topLimitSwitch].value === expectedState) return { result: true, msg: SmartTestDevice.MOVING_SUCESS }

            if (!DAQ.in[this.hardware.emergency].value) return { result: false, msg: SmartTestDevice.MOVING_INTERRUPT }

            while (loopControl && DAQ.in[this.hardware.emergency].value && DAQ.in[this.hardware.topLimitSwitch].value !== expectedState) {
                if (!Relays.enabledRelays.has(this.hardware.upRelay)) await Relays.enable(this.hardware.upRelay)
                await this.delay(50)
            }

            if (Relays.enabledRelays.has(this.hardware.upRelay)) await Relays.disable(this.hardware.upRelay)
            await this.delay(50)
        }

        return { result: false, msg: SmartTestDevice.MOVING_TIMEOUT }
    }

    /** Monitora o acionamento do bimanual */
    static async bimanualObserver(timeout = 15000) {
        if (DAQ.in[this.hardware.bimanual].value) { return { result: false, msg: SmartTestDevice.BIMANUAL_ALWAYS_TRIGGERED } }

        let loopControl = true
        setTimeout(() => loopControl = false, timeout)

        while (loopControl && !DAQ.in[this.hardware.bimanual].value) await this.delay(50)

        return DAQ.in[this.hardware.bimanual].value ? { result: true, msg: this.BIMANUAL_TRIGGERED } : { result: false, msg: this.BIMANUAL_TIMEOUT }
    }

    /** Monitora o acionamento da emergência */
    static async emergencyObserver() {
        if (DAQ.in[this.hardware.emergency].value === false) return { triggered: true, msg: this.EMERGENCY_ALWAYS_TRIGGERED }

        while (DAQ.in[this.hardware.emergency].value) await this.delay(50)
        return { triggered: true, msg: this.EMERGENCY_TRIGGERED }
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
    static async SetupFixture(element = document.getElementsByTagName('main')[0], imgAlinhamento, msgAlinhamento) {
        const Setup = new FixtureSetup(element)

        let emergencyAlwaysTriggered = false
        const result = await Promise.race([SetupModal(), emergency()])
        Setup.hide()
        return result

        async function emergency() {
            const retornoEmergencia = await SmartTestDevice.emergencyObserver()
            emergencyAlwaysTriggered = true
            return { result: false, msg: retornoEmergencia.msg }
        }

        /**
         * @return {Promise<{ result: boolean, msg: string }>}
         */
        async function SetupModal() {
            imgAlinhamento ??= `node_modules/@libs-scripts-mep/std-control/web-component-setup/images/encaixeAgulhas.jpeg`
            msgAlinhamento ??= `Coloque a placa no fixture, em seguida, coloque o fixture superior em cima, caso o fixture tenha agulhas, 
            alinhe o fixture de acordo com o encaixe das agulhas, como na imagem.\n\nem seguida clique em AVANÇAR ou pressione a tecla 'Enter'`

            const moveUpInitial = await SmartTestDevice.moveUp(8000)
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
                `Certifique-se de que todos os maipulos estão paralelos ao arco e então PRESSIONE O BIMANUAL`, undefined, SmartTestDevice.moveDown(240000), false)
            if (!moveDown.result) { return moveDown }

            await Setup.modalDark(`node_modules/@libs-scripts-mep/std-control/web-component-setup/images/ajustaComFixture.gif`,
                `Ajuste todos os manipulos para que prendam o fixture superior,\n para fazer isso pressione o manipulo pra baixo e gire no sentido horario, como no gif.
                \n\nquando o fixture superior estiver preso, clique em AVANÇAR ou pressione a tecla 'Enter'`)

            const moveUp = await SmartTestDevice.moveUp(10000)
            if (!moveUp.result) { return moveUp }

            return { result: true, msg: `instrução bem sucedida` }
        }
    }

    static {
        window.STD = SmartTestDevice
        Relays.addProhibitedCombination([this.hardware.upRelay, this.hardware.downRelay])
    }
}