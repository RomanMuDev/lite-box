import App from "./root/App";
import Controller from "./root/controller";

const app = Vue.createApp(App);

app.mount("#root");
Controller.init();
