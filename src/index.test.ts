import StaticGenerator, { HTML_TEMPLATE } from "./StaticGenerator";

const appMock = {
  listen: jest.fn().mockReturnThis(),
  on: jest.fn().mockImplementationOnce((event, handler) => {
    handler();
  }),
};
jest.doMock("chokidar", () => jest.fn(() => appMock));

describe("SiteGenerator", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Instantiates without failure", async () => {
    const t = new StaticGenerator();
    expect(t).toBeInstanceOf(StaticGenerator);
    t.stopBrowserSync();
  });

  it("Starts & stops browser-sync", async () => {
    const t = new StaticGenerator();
    t.startBrowserSync();
    expect(t.bs.active).toEqual(true);
    t.stopBrowserSync();
    expect(t.bs.active).toEqual(false);
  });

  it("Listens to file events", async () => {
    const t = new StaticGenerator();

    t.stopBrowserSync();
  });
});
