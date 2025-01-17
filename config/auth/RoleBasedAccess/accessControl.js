const {roles} = require('./Roles')

const accessControl = (requiredPrivileges) => {
    return (req,res,next)=>{
        const {roles:userRoles} = req.user;

        if (!userRoles || userRoles.length === 0){
            return res.status(401).json({ message: 'Unauthorized: No roles provided' });
        }

        let aggregatedPrivileges = new Set();

        userRoles.forEach((role) => {
            const rolePrivileges = roles[role] || [];
            rolePrivileges.forEach((privilege) => {
                aggregatedPrivileges.add(privilege);
            })
        })

        aggregatedPrivileges = Array.from(aggregatedPrivileges);

        const hasPrivilege = requiredPrivileges.some(privilege => aggregatedPrivileges.includes(privilege) ||
            aggregatedPrivileges.includes('all'));

        if (!hasPrivilege) {
            return res.status(403).json({ message: 'You do not have the required privileges' });
        }

        next()

    }

}

module.exports = {accessControl}