import { Parser, createRenderHTML } from '@toast-ui/toastmark';
const toastmark = function (content)
{
    const parser = new Parser();
    const root = parser.parse(content);
    const renderHTML = createRenderHTML();
    return renderHTML(root);
}