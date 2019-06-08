import { expect } from 'chai';
import add from '../index';

describe('index', () => {
  it('should return addion of numbers', () => {
    expect(add(2, 5)).to.equal(7);
  });
});