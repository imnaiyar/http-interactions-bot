import {
  type APIInteraction,
  type APIMessageComponentInteraction,
  type APIModalSubmitInteraction,
  InteractionType,
} from "@discordjs/core/http-only";
import { EventEmitter } from "node:events";
import type App from "@/app";

interface CollectorOptions<T extends InteractionType.MessageComponent | InteractionType.ModalSubmit> {
  filter?: (
    int: T extends InteractionType.MessageComponent ? APIMessageComponentInteraction : APIModalSubmitInteraction,
  ) => boolean;
  max?: number;
  timeout?: number;
  idle?: number;
  type?: T;
}
declare interface Collector<
  T extends InteractionType.MessageComponent | InteractionType.ModalSubmit = InteractionType.MessageComponent,
> {
  on(
    event: "collect",
    listener: (
      args: T extends InteractionType.MessageComponent ? APIMessageComponentInteraction : APIModalSubmitInteraction,
    ) => any,
  ): this;
  on(
    event: "end",
    listener: (
      args: T extends InteractionType.MessageComponent ? APIMessageComponentInteraction[] : APIModalSubmitInteraction[],
      reason: string,
    ) => any,
  ): this;
}

class Collector<
  T extends InteractionType.MessageComponent | InteractionType.ModalSubmit = InteractionType.MessageComponent,
> extends EventEmitter {
  private collected: (APIMessageComponentInteraction | APIModalSubmitInteraction)[] = [];
  private timer: Timer | undefined;
  private type: T;
  private filter: (int: APIMessageComponentInteraction | APIModalSubmitInteraction) => boolean;

  public constructor(
    private app: typeof App,
    private options: CollectorOptions<T> = {},
  ) {
    super();
    // @ts-ignore I do not have the patience to fix this type gymnastic, sorry lol
    this.filter = options.filter ?? (() => true);
    if (options.type) this.type = options.type;
    else this.type = InteractionType.MessageComponent as T;
    this.timer = options.timeout
      ? setTimeout(() => this.end("timeout"), options.timeout)
      : options.idle
        ? setTimeout(() => this.end("timeout"), options.idle)
        : undefined;
    this.listener = this.listener.bind(this);

    app.addListener("interaction", this.listener);
  }

  private listener(int: APIInteraction) {
    if (int.type !== this.type) return;

    const passesFilter = this.filter(int);

    if (!passesFilter) return;

    this.emit("collect", int);

    this.collected.push(int);
    if (this.options.idle) {
      clearTimeout(this.timer);
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
