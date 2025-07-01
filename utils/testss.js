const timeStamps = new Date().toISOString();
const date = timeStamps.split('T')[0];
// const [hour,min] = timeStamps.split('T')[1].split(':')
// const time = `${hour}:${min}`;
//
// console.log(date);
// console.log(time);
console.log(date)

const user = {
    name: "admin",
    password: "<PASSWORD>",
}

console.log(user['password'])


const listNumber = [1,3,3,4,6,6,7,8,10,9,10]

const uniqueList = [...new Set(listNumber)]

console.log(uniqueList)