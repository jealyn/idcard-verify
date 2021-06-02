js 身份证格式校验

# 前言

前端开发中，在身份证号码录入场景我们通常都会进行格式校验，一般是通过一个正则表达式来进行校验，如下:

```js
/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
```

但是仅仅使用一个正则表达式来进行格式校验，还是有很多不足的，主要表现在：

- 未进行行政区划代码对比。身份证号前 6 位为省市区的行政区域代码，如 130102 为河北省石家庄市长安区，但在正则中没有进行对应，很有可能会出现用户胡乱输入的情况
- 未进行日期的强校验。虽然正则表达式对日期已经做了一部分校验，但像 20210231（2 月没有 31 日）、20990101（本文写于 2021 年，这个时候怎么可能有 2099 年的身份证号）等仍然会被判断为格式符合，这显然是不正确的
- 未判断校验码是否正确。身份证的最后一位为检验码，其是通过一定的规则得到的，需根据规则校验以判断输入身份证号的格式有效性。

所以，我们需要更严苛的代码来校验。在此之前，我们先来看一下中国第二代居民身份证的组成规则。

# 身份证格式

18 位身份证标准在国家质量技术监督局于 1999 年 7 月 1 日实施的 GB11643-1999《公民身份号码》中做了明确的规定。

公民身份号码是特征组合码，由十七位数字本体码和一位校验码组成。排列顺序从左至右依次为：六位数字地址码，八位数字出生日期码，三位数字顺序码和一位数字校验码。

![身份证号码格式图](https://jealyn-1258764186.file.myqcloud.com/751622529223_.pic.jpg)

## 地址码

表示编码对象常住户口所在县(市、旗、区)的行政区划代码，按 GB/T2260 的规定执行。

## 出生日期码

表示编码对象出生的年、月、日，按 GB/T7408 的规定执行，年、月、日代码之间不用分隔符。

## 顺序码

表示在同一地址码所标识的区域范围内，对同年、同月、同日出生的人编定的顺序号，顺序码的奇数分配给男性，偶数分配给女性。

## 校验码

根据 ISO 7064:1983.MOD 11-2，校验码的计算方法如下：

- 将十七位数字本体码，分别乘以不同的系数。从第一位到第十七位的系数分别为：7、9、10、5、8、4、2、1、6、3、7、9、10、5、8、4、2；
- 将这 17 位数字和系数相乘的结果相加；
- 用加出来的值除以 11，看余数是多少
- 余数只可能有 0 、1、 2、 3、 4、 5、 6、 7、 8、 9、 10 这 11 个数字。其分别对应的最后一位身份证的号码为 1、0、X、9、8、7、6、5、4、3、2；
  ![校验码换算关系图](https://jealyn-1258764186.file.myqcloud.com/741622529073_.pic.jpg)

# 编写身份证校验函数

根据上面提到的身份证格式规则，我们就可以来编写身份证校验函数了。

函数主体如下：

```js
/**
 * @description 身份证号码校验，判断输入的身份证号码是否合法
 * @param {String} cardNum 待校验身份证号码
 * @returns {Boolean} 是否校验通过
 */
const verifyCardNum = (cardNum = "") => {};
```

## 基础校验

先对参数进行一定的格式化处理，然后进行一些简单的长度和正则校验，如果不通过则直接返回 `false`，否则再进行后面的校验流程。

```js
// 对参数进行格式化
const serializedCardNum = cardNum.toString().trim();
// 长度校验
if (serializedCardNum.length !== 18) return false;
// 简单的正则校验
if (!/^[1-9]\d{5}(18|19|[2-9]\d)\d{9}[0-9Xx]$/.test(serializedCardNum))
  return false;
```

## 地址码校验

接下来进行地址码的校验，根据 GB/T2260 和民政部每年发布的行政区划代码，可定义一个地址码列表。如下所示：

```js
const areaMap = new Set([
  110101, 110102, 110103, 110104, 110105,
  //...others
]);
```

使用集合(`Set`)来进行存储，读取速度更快，并且当后续有地址码更新时，操作也更简便（不会重复）。

然后进行地址码校验，判断该地址码是否存在于定义的映射表之中，若不存在，则返回 `false`，否则进行下一步校验。

```js
// 地址码检验
const areaCode = Number(serializedCardNum.slice(0, 6));
if (!areaSet.has(areaCode)) return false;
```

## 日期码校验

接下来进行日期码的校验，身份证中日期为 8 位的 `yyyymmdd` 格式。日期校验中，主要是判断传入的日期格式是否有效以及是否在当天及以前。

先来定义一个函数，封装日期校验功能。

```js
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
  // 如果传入的日期领先于当前日期，比如传入 29990102 则返回 false
  if (birthDate > new Date().getTime()) return false;
  // 否则返回 true，检验通过
  return true;
};
```

在主函数中使用：

```js
// 出生日期码校验
const birthCode = serializedCardNum.slice(6, 14);
if (!verifyBirthDate(birthCode)) return false;
```

出生日期码校验通过之后，再执行校验码的校验。

## 校验码校验

根据之前提到的校验码生成公式，编写对应的函数实现：

```js
/**
 * @description 校验码字符校验函数
 * @param {String} cardNum 传入的身份证号
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
    0: 1,
    1: 0,
    2: "x",
    3: 9,
    4: 8,
    5: 7,
    6: 6,
    7: 5,
    8: 4,
    9: 3,
    10: 2,
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
```

在主函数中使用

```js
// 校验码校验
if (!verifyCheckCode(serializedCardNum)) return false;
```

当上述所有校验通过后，则返回 `true`。

# 总结

本文分享了中国第二代公民身份号码的结构和规则，并阐述了进行身份证号码强校验的 JS 代码。采用这种方式，能大大提高输入身份证号码的真实性。当然，这也仅仅是防君子不防小人，也同样能生成出很多符合规则的但是并未被真实使用的身份证号码。所以，该方式不能用来校验身份证号码是否真实存在，只能判断输入身份证号是否符合既定规则。

# 参考链接

- [GB 11643-1999](http://www.gb688.cn/bzgk/gb/newGbInfo?hcno=080D6FBF2BB468F9007657F26D60013E)
- [GB/T 2260](http://www.gb688.cn/bzgk/gb/newGbInfo?hcno=C9C488FD717AFDCD52157F41C3302C6D)
- [民政部行政区划代码](http://www.mca.gov.cn/article/sj/xzqh/1980/)
