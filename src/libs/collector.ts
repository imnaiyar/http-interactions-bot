import { type APIInteraction, type APIMessageComponentInteraction, InteractionType } from "@discordjs/core/http-only";
import { EventEmitter } from "node:events";
import type App from "#src/app";

interface CollectorOptions {
  filter?: (int: APIMessageComponentInteraction) => boolean;
  max?: number;
  timeout?: number;
  idle?: number;
}
declare interface Collector {
  on(event: "collect", listener: (args: APIMessageComponentInteraction) => any): this;
  on(event: "end", listener: (args: APIMessageComponentInteraction[], reason: string) => any): this;
}

class Collector extends EventEmitter {
  private collected: APIMessageComponentInteraction[] = [];
  private timer: Timer | undefined;
  private filter: (int: APIMessageComponentInteraction) => boolean;

  public constructor(
    private app: typeof App,
    private options: CollectorOptions = {},
  ) {
    super();
    this.filter = options.filter ?? (() => true);
    this.timer = options.timeout
      ? setTimeout(() => this.end("timeout"), options.timeout)
      : options.idle
        ? setTimeout(() => this.end("timeout"), options.idle)
        : undefined;
    this.listener = this.listener.bind(this);

    app.addListener("interaction", this.listener);
  }

  private listener(int: APIInteraction) {
    if (int.type !== InteractionType.MessageComponent) return;

    const passesFilter = this.filter(int);

    if (!passesFilter) return;

    this.emit("collect", int);

    this.collected.push(int);
    if (this.options.idle) {
      clearTimeout(this.timer);
      console.log("collector reset");
      this.timer = setTimeout(() => this.end("timeout"), this.options.idle);
    }

    if (this.options.max && this.collected.length >= this.options.max) this.end("max");
  }

  private end(reason: string) {
    this.app.removeListener("interaction", this.listener);

    clearTimeout(this.timer);
    this.emit("end", this.collected, reason);
  }
}

export { Collector };
