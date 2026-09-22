export interface TeamsNotifier {
  /** Power Automate HTTP endpoint:
   *  trigger = "When an HTTP request is received"
   *  e.g. https://prod-00.westeurope.logic.azure.com/workflows/...
   */
  powerAutomateUrl: string;
}
