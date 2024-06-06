import areaSet from "./area.js";

/**
 * @description 校验出生日期
 * @param {String} birth 8位出生日期 形如20210601
 * @returns {Boolean} 校验是否通过
 */
const verifyBirthDate = (birth) => {
  // 格式化传入的日期格式为 yyyy-mm-dd
  const serializedBirth = `${birth.slice(0, 4)}-${birth.slice(
    4,
    6
  )}-${birth.slice(6)}`;
  const birthDate = new Date(serializedBirth).getTime();

  // 如果日期格式无效，形如 2020-13-14、2021-02-29 等，则返回 false
  // 无效的日期格式，Date.prototype.getTime() 会返回 NaN
  if (Number.isNaN(birthDate)) return false;
  // 如果传入的日期领先于当前日期，比如传入 20990102 则返回 false
  if (birthDate > new Date().getTime()) return false;
  // 否则返回 true，检验通过
  return true;
};

/**
 * @description 校验码字符校验函数
 * @param {String} cardNum 传入的身份证号
 * @returns {Boolean} 校验是否通过
 */
const verifyCheckCode = (cardNum) => {
  // 本体码
  const masterCode = cardNum.slice(0, 17).split("");
  // 校验码
  const checkCode = cardNum.slice(17).toLocaleLowerCase();
  // 校验因子
  const weightingFactor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  // 校验码换算关系
  const pattern = {
    0: "1",
    1: "0",
    2: "x",
    3: "9",
    4: "8",
    5: "7",
    6: "6",
    7: "5",
    8: "4",
    9: "3",
    10: "2",
  };
  // 各位值与对应校验因子相乘，并求和
  const sum = masterCode.reduce(
    (pre, cur, ix) => pre + cur * weightingFactor[ix],
    0
  );
  // 累加值对11取余
  const val = sum % 11;
  // 能与换算关系对应上则返回true，否则返回false
  if (pattern[val] !== checkCode) return false;
  return true;
};

/**
 * @description 身份证号码校验，判断输入的身份证号码是否合法
 * @param {String} cardNum 待校验身份证号码
 * @returns {Boolean} 是否校验通过
 */
const verifyCardNum = (cardNum = "") => {
  // 对参数进行格式化
  const serializedCardNum = cardNum.toString().trim();

  // 长度校验
  if (serializedCardNum.length !== 18) return false;

  // 简单的正则校验
  if (!/^[1-9]\d{5}(18|19|[2-9]\d)\d{9}[0-9Xx]$/.test(serializedCardNum))
    return false;

  // 地址码检验
  const areaCode = Number(serializedCardNum.slice(0, 6));
  if (!areaSet.has(areaCode)) return false;

  // 出生日期码校验
  const birthCode = serializedCardNum.slice(6, 14);
  if (!verifyBirthDate(birthCode)) return false;

  // 校验码校验
  if (!verifyCheckCode(serializedCardNum)) return false;

  // 所有校验通过后，返回true
  return true;
};

export default verifyCardNum;
