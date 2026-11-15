import { offspringRisk, sickleDiseaseChance } from '../genotype';

test('AA x AA gives only AA', () => {
  expect(offspringRisk('AA', 'AA')).toEqual({ AA: 1 });
});

test('AS x AS gives 25% AA, 50% AS, 25% SS', () => {
  expect(offspringRisk('AS', 'AS')).toEqual({ AA: 0.25, AS: 0.5, SS: 0.25 });
  expect(sickleDiseaseChance(offspringRisk('AS', 'AS'))).toBe(0.25);
});

test('AS x AA has no sickle disease chance', () => {
  expect(offspringRisk('AS', 'AA')).toEqual({ AA: 0.5, AS: 0.5 });
  expect(sickleDiseaseChance(offspringRisk('AS', 'AA'))).toBe(0);
});

test('AS x SC gives AS, AC, SS, SC at 25% each', () => {
  expect(offspringRisk('AS', 'SC')).toEqual({ AS: 0.25, AC: 0.25, SS: 0.25, SC: 0.25 });
  expect(sickleDiseaseChance(offspringRisk('AS', 'SC'))).toBe(0.5);
});

test('SS x SS gives only SS', () => {
  expect(offspringRisk('SS', 'SS')).toEqual({ SS: 1 });
});

test('AC x AC includes CC', () => {
  expect(offspringRisk('AC', 'AC')).toEqual({ AA: 0.25, AC: 0.5, CC: 0.25 });
});

test('order of parents does not matter', () => {
  expect(offspringRisk('AS', 'SC')).toEqual(offspringRisk('SC', 'AS'));
});
