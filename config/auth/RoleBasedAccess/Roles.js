const roles = {
    admin:['all'],
    manager:['apply','approve','dpt_report'],
    assistant_Manager:['apply','approve','dpt_report'],
    driver:['start','end'],
    applicant:['apply','user_report']
}


const user1 = {
    name:"admin",
    email:"admin@gmail.com",
}

const user2 = user1

user2.phone = "071232232"

console.log(user2['name'])


module.exports = {roles}