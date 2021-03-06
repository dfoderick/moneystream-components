import { Component, Host, h, State, Listen, Prop } from '@stencil/core'
import { checkExtension, startMonetization, stopMonetization } from '../../js/moneystream_utils'

@Component({
  tag: 'moneystream-dash',
  styleUrl: 'moneystream-dash.css',
  shadow: true,
})
export class MoneystreamDash {
  @Prop() debug: boolean = false
  @Prop() showControls: boolean = false
  // null/pending/monetized/stop
  @State() monetizationstatus:string = null
  // counts up, funding amount for the ongoing channel
  @State() monetizationamount:number = 0
  // // balance from moneystream wallet
  // @State() moneystreambalance:number = 0
  @State() xtn:any = {name:"MoneyStream",version:"0.0.0",balanceSatoshis:0}
  @State() messages:string = ''

  logMessage = (msg) => {
    // console.log(msg)
    this.messages += `${JSON.stringify(msg)}\r\n`
  }

  componentWillLoad() {
    checkExtension()
  }

  //Listen to message and process
  @Listen('message', { target: 'window' })
  messageHandler(event) {
    //console.log('Received the custom message event: ', ev)
    if (event.source == window &&
      event.data.direction &&
      event.data.direction == "extension-to-browser") {
      // for testing
      this.logMessage(event.data.message)
    }
    if (event.data.command == "info") {
      this.xtn = event.data.message
      //this.whenExtensionDetected(this.xtn)
    } else {
      if (event.data && event.data != "") {
          if (event.data.direction == "browser-to-extension") {
              this.logMessage(event.data.message)
          } else {
              //logMessage(event.data)
          }
      }
    }
    if (event.data.type == "monetizationstart") {
      this.logMessage(event.data)
      this.monetizationstatus = 'pending'
    }
    if (event.data.type == "monetizationprogress") {
      this.logMessage(event.data)
      this.monetizationamount += parseInt(event.data.detail.amount,10)
      if (this.monetizationamount > 200) {
          this.monetizationstatus = 'monetized'
      } else {
          this.monetizationstatus = 'pending'
      }
    }
    if (event.data.type == "monetizationstop") {
      this.logMessage(event.data)
      this.monetizationstatus = 'stop'
    }
  }

  getStatusClass () {
    if (this.monetizationstatus === 'monetized') {
        return "moneystream-status-monetized"
    } else if (this.monetizationstatus === 'pending') {
        return "moneystream-status-pending"
    } else if (this.monetizationstatus === 'stop') {
        return "moneystream-status-stop"
    } else {
        return "moneystream-status-default"
    }
  }

  onInfo = () => {
    checkExtension()
  }
  onStart = () => {
      startMonetization(window.location.href,'fullcycle@moneybutton.com')
  }
  onStop = () => {
      stopMonetization()
  }

  render() {
    return (
      <Host>
        <div class="moneystream">
          <a class="moneystream" href="https://moneystreamdev.github.io/moneystream-project/" target="_blank"><span id="txtExtensionName" title={`${this.xtn.name} v${this.xtn.version}`}>{this.xtn.name}</span></a>
          <span id="txtExtensionVersion" class="moneystream-hidden">{this.xtn.version}</span>
          <span id="txtExtensionStatus" class={this.getStatusClass()} title="MoneyStream Status">&#8621;</span>
          <span id="txtExtensionBalance" class="moneystream-balance" title="MoneyStream Balance">{this.xtn.balanceSatoshis-this.monetizationamount}</span>
          <button class={this.showControls===false?'moneystream-button moneystream-hidden':'moneystream-button'} onClick={this.onInfo}>&#x21BB;</button>
          <button class={this.showControls===false?'moneystream-button moneystream-hidden':'moneystream-button'} onClick={this.onStart}>&#x23F5;</button>
          <button class={this.showControls===false?'moneystream-button moneystream-hidden':'moneystream-button'} onClick={this.onStop}>&#x23F9;</button>
        </div>
        <pre id='moneystream-messages' class={this.debug===false?'moneystream-hidden':''}>{this.messages}</pre>
      </Host>
    );
  }

}
