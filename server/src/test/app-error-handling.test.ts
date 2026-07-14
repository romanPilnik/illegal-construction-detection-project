import { describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

process.env.JWT_SECRET = 'app-error-test-secret';

jest.unstable_mockModule('../lib/prisma.js', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

const { errorHandler, notFoundHandler } = await import('../app.js');

const createResponse = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;
  jest.mocked(response.status).mockReturnValue(response);
  return response;
};

describe('application error responses', () => {
  it('returns JSON for unknown routes', () => {
    const response = createResponse();

    notFoundHandler({} as Request, response);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ message: 'Route not found.' });
  });

  it('returns sanitized JSON for malformed request bodies', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const response = createResponse();
    const parseError = Object.assign(new SyntaxError('Unexpected JSON'), {
      status: 400,
    });

    errorHandler(
      parseError,
      {} as Request,
      response,
      jest.fn() as NextFunction
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      message: 'Invalid request body.',
    });
    consoleError.mockRestore();
  });
});
