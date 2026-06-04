/**
 * PromptPay EMVCo QR Code Payload Builder
 * Fully compliant with the Thai PromptPay standard.
 */
const PromptPay = {
    /**
     * Generates a valid PromptPay QR code payload string.
     * @param {string} target - PromptPay Mobile number (e.g. "0924998924") or National ID
     * @param {number|string} amount - Transfer amount (e.g. 29.00), optional
     * @returns {string} Fully checksummed PromptPay payload string
     */
    generatePayload(target, amount) {
        let payload = '';

        // 1. Payload Format Indicator (tag 00, length 02, value 01)
        payload += '000201';

        // 2. Point of Initiation Method
        // tag 01, length 02
        // value 11: Static QR (open amount or reusable)
        // value 12: Dynamic QR (set amount, single-use)
        payload += amount ? '010212' : '010211';

        // 3. Merchant Account Information - PromptPay credit transfer (tag 30)
        const guid = 'A000000677010111'; // PromptPay GUID
        let cleanTarget = target.replace(/[^0-9]/g, '');

        // Format phone number according to PromptPay specification:
        // Must be 13 digits starting with 0066 (replacing the leading '0' with '66')
        if (cleanTarget.length === 10 && cleanTarget.startsWith('0')) {
            cleanTarget = '0066' + cleanTarget.substring(1);
        } else if (cleanTarget.length === 9 && !cleanTarget.startsWith('0')) {
            cleanTarget = '0066' + cleanTarget;
        }

        // Subtags for Merchant Account Info (tag 30):
        // Subtag 00: GUID (0016A000000677010111)
        // Subtag 01: Account target (01130066924998924)
        const subtag00 = '00' + String(guid.length).padStart(2, '0') + guid;
        const subtag01 = '01' + String(cleanTarget.length).padStart(2, '0') + cleanTarget;
        const merchantAccountInfoValue = subtag00 + subtag01;

        payload += '30' + String(merchantAccountInfoValue.length).padStart(2, '0') + merchantAccountInfoValue;

        // 4. Country Code (tag 58, length 02, value TH)
        payload += '5802TH';

        // 5. Transaction Currency Code (tag 53, length 03, value 764 for Thai Baht)
        payload += '5303764';

        // 6. Transaction Amount (tag 54, length is amount string length)
        if (amount) {
            const formattedAmount = parseFloat(amount).toFixed(2);
            payload += '54' + String(formattedAmount.length).padStart(2, '0') + formattedAmount;
        }

        // 7. CRC Checksum tag header (tag 63, length 04)
        payload += '6304';

        // 8. Compute and append CCITT-CRC16 checksum
        const crcValue = this.computeCRC16(payload);
        payload += crcValue;

        return payload;
    },

    /**
     * Calculates the CRC-CCITT (0xFFFF) 16-bit checksum.
     * Used widely in EMVCo QR code formats.
     * @param {string} data - Input string to checksum
     * @returns {string} 4-character uppercase Hexadecimal checksum
     */
    computeCRC16(data) {
        let crc = 0xFFFF;
        for (let i = 0; i < data.length; i++) {
            let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
            x ^= x >> 4;
            crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
        }
        return crc.toString(16).toUpperCase().padStart(4, '0');
    }
};

// Export to window object for global script references
window.PromptPay = PromptPay;
