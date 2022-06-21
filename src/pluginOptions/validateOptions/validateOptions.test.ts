import type { Reporter } from 'gatsby';
import { MockProxy, mock } from 'jest-mock-extended';

import { validateOptions } from './validateOptions';
import { ValidateOptionsProps } from './validateOptions.types';

describe(`validateOptions`, () => {
  let props: ValidateOptionsProps;
  let options: any;
  let mockReporter: MockProxy<Reporter>;

  beforeEach(() => {
    mockReporter = mock<Reporter>();
    props = {
      reporter: mockReporter,
    };
    options = {};
  });

  it(`should exist`, () => {
    expect(validateOptions).toBeDefined();
  });

  const execute = () => validateOptions({ ...props }, { ...options });

  it(`should run when provided required config options`, () => {
    options.node = `https://elastic.endpoint.com/`;
    options.queries = [];

    execute();

    expect(mockReporter.panic).not.toHaveBeenCalled();
  });

  it(`should report problems with empty config`, () => {
    execute();

    expect(mockReporter.panic).toHaveBeenCalled();
    expect(mockReporter.panic.mock.calls[0][0]).toMatch(
      `[ElasticSearch] Problems with plugin options:`
    );
  });

  it(`should report if "node" value in not set`, () => {
    execute();

    expect(mockReporter.panic).toHaveBeenCalled();
    expect(mockReporter.panic.mock.calls[0][0]).toMatch(`"node" is required`);
  });

  it(`should report if "queries" value in not set`, () => {
    options.node = `https://elastic.endpoint.com/`;

    execute();

    expect(mockReporter.panic).toHaveBeenCalled();
    expect(mockReporter.panic.mock.calls[0][0]).toMatch(
      `"queries" is required`
    );
  });

  it(`should make sensitive "apiKey" data is hidden`, () => {
    options.apiKey = `abcdefghijklmnopqrstuvwxyz`;

    execute();

    expect(mockReporter.panic).toHaveBeenCalled();
    expect(mockReporter.panic.mock.calls[0][0]).toMatch(
      `[ElasticSearch] Problems with plugin options:`
    );
    expect(mockReporter.panic.mock.calls[0][0]).toMatch(
      `**********************wxyz`
    );
  });

  it(`should report if "auth" value in not an object`, () => {
    options.node = `https://elastic.endpoint.com/`;
    options.queries = [];
    options.auth = 1;

    execute();

    expect(mockReporter.panic).toHaveBeenCalled();
    expect(mockReporter.panic.mock.calls[0][0]).toMatch(
      `"auth" must be of type object`
    );
  });

  it(`should report if "auth.password" is missing`, () => {
    options.node = `https://elastic.endpoint.com/`;
    options.queries = [];
    options.auth = {};

    execute();

    expect(mockReporter.panic).toHaveBeenCalled();
    expect(mockReporter.panic.mock.calls[0][0]).toMatch(
      `"auth.password" is required`
    );
  });

  it(`should report if "auth.password" is not a string`, () => {
    options.node = `https://elastic.endpoint.com/`;
    options.queries = [];
    options.auth = { password: 1 };

    execute();

    expect(mockReporter.panic).toHaveBeenCalled();
    expect(mockReporter.panic.mock.calls[0][0]).toMatch(
      `"auth.password" must be a string`
    );
  });

  it(`should report if "auth.username" is missing`, () => {
    options.node = `https://elastic.endpoint.com/`;
    options.queries = [];
    options.auth = { password: `secret` };

    execute();

    expect(mockReporter.panic).toHaveBeenCalled();
    expect(mockReporter.panic.mock.calls[0][0]).toMatch(
      `"auth.username" is required`
    );
  });

  it(`should report if "auth.username" is not a string`, () => {
    options.node = `https://elastic.endpoint.com/`;
    options.queries = [];
    options.auth = { password: `secret`, username: 1 };

    execute();

    expect(mockReporter.panic).toHaveBeenCalled();
    expect(mockReporter.panic.mock.calls[0][0]).toMatch(
      `"auth.username" must be a string`
    );
  });

  it(`should run when provided required "auth" options`, () => {
    options.node = `https://elastic.endpoint.com/`;
    options.queries = [];
    options.auth = { password: `secret`, username: `john` };

    execute();

    expect(mockReporter.panic).not.toHaveBeenCalled();
  });

  it(`should report if "apiKey" value is not a string`, () => {
    options.node = `https://elastic.endpoint.com/`;
    options.queries = [];
    options.apiKey = 1;

    execute();

    expect(mockReporter.panic).toHaveBeenCalled();
    expect(mockReporter.panic.mock.calls[0][0]).toMatch(
      `"apiKey" must be a string`
    );
  });

  it(`should run when provided valid "apiKey" options`, () => {
    options.node = `https://elastic.endpoint.com/`;
    options.queries = [];
    options.apiKey = `someApiKey`;

    execute();

    expect(mockReporter.panic).not.toHaveBeenCalled();
  });

  it(`should report if "chunkSize" value is not a string`, () => {
    options.node = `https://elastic.endpoint.com/`;
    options.queries = [];
    options.chunkSize = `string value`;

    execute();

    expect(mockReporter.panic).toHaveBeenCalled();
    expect(mockReporter.panic.mock.calls[0][0]).toMatch(
      `"chunkSize" must be a number`
    );
  });

  it(`should report if "chunkSize" value is too small`, () => {
    options.node = `https://elastic.endpoint.com/`;
    options.queries = [];
    options.chunkSize = 0;

    execute();

    expect(mockReporter.panic).toHaveBeenCalled();
    expect(mockReporter.panic.mock.calls[0][0]).toMatch(
      `"chunkSize" must be greater than or equal to 1`
    );
  });

  it(`should run when provided valid "chunkSize" options`, () => {
    options.node = `https://elastic.endpoint.com/`;
    options.queries = [];
    options.chunkSize = 10000;

    execute();

    expect(mockReporter.panic).not.toHaveBeenCalled();
  });
});
