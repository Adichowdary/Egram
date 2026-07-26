
export const getInitials = (nameOrEmail: string | null) => {
    if (!nameOrEmail) return "U";
    return nameOrEmail.substring(0, 2).toUpperCase();
};

describe('Utility Functions', () => {
    describe('getInitials', () => {
        it('should return uppercase initials for a name', () => {
            expect(getInitials('John Doe')).toBe('JO');
        });

        it('should return uppercase initials for an email', () => {
            expect(getInitials('alice@example.com')).toBe('AL');
        });

        it('should return "U" for null', () => {
            expect(getInitials(null)).toBe('U');
        });

        it('should return "U" for empty string', () => {
            expect(getInitials('')).toBe('U');
        });
    });
});
