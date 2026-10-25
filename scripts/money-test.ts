import { pressCalcKey, calcResult, calcDisplay, emptyCalc, yuanToCent, centToDisplay } from '../src/utils/money';

let s = emptyCalc;
for (const k of ['1','2','\.','5']) s = pressCalcKey(s, k);
console.log('12.5 =', calcDisplay(s), calcResult(s) === 12.5 ? 'PASS' : 'FAIL');
for (const k of ['+','8']) s = pressCalcKey(s, k);
console.log('12.5+8 =', calcDisplay(s), calcResult(s) === 20.5 ? 'PASS' : 'FAIL');
s = pressCalcKey(s, '-');
console.log('editing hint state base empty, display =', calcDisplay(s));
for (const k of ['3']) s = pressCalcKey(s, k);
console.log('20.5-3 =', calcDisplay(s), calcResult(s) === 17.5 ? 'PASS' : 'FAIL');
for (let i=0;i<5;i++) s = pressCalcKey(s, 'back');
console.log('backspace x5 ->', calcDisplay(s), calcDisplay(s) === '20' ? 'PASS' : 'FAIL'); // 逐字回退
s = emptyCalc;
for (const k of ['0','0','7']) s = pressCalcKey(s, k);
console.log('007 -> 7:', calcDisplay(s), calcResult(s) === 7 ? 'PASS' : 'FAIL');
s = emptyCalc;
for (const k of ['1','2','3','4','5','6','7','8','9']) s = pressCalcKey(s, k);
console.log('max 7 digits:', calcDisplay(s), calcDisplay(s) === '1234567' ? 'PASS' : 'FAIL');
s = emptyCalc;
for (const k of ['1','.','9','9']) s = pressCalcKey(s, k);
console.log('1.99 + . =', calcDisplay(s));
console.log('yuanToCent(12.5)=', yuanToCent(12.5), ' centToDisplay(1250)=', centToDisplay(1250), ' centToDisplay(1200)=', centToDisplay(1200));

// 完整清空 + 空态改运算符
let e = emptyCalc;
for (const k of ['2','0','+']) e = pressCalcKey(e, k);
e = pressCalcKey(e, '-'); // 空操作数时改运算符
console.log('20 then swap op:', calcDisplay(e), calcDisplay(e) === '20-' ? 'PASS' : 'FAIL');
for (let i=0;i<10;i++) e = pressCalcKey(e, 'back');
console.log('full clear:', calcDisplay(e), calcDisplay(e) === '0' ? 'PASS' : 'FAIL');
