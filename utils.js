export const getInitialsAndTitle = (name, gender) => {

    const nameParts = name?.split(' ');

    const initials = nameParts.map(part => part[0]?.toUpperCase())?.join('');

    let title;
    if (gender?.toLowerCase() === 'male') {
        title = 'Sir';
    } else {
        title = "Ma'am";
    }

    return `${initials} ${title}`;
}

export function getFirstName(fullName) {
    const nameParts = fullName?.trim()?.split(' ');
    return nameParts[0];
}