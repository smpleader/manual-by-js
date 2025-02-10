function ManualByJs(options = {}){
    this.flag = options.flag || ''
    this.folderContent = options.folderContent || 'content'
    this.index = options.index || 'home'
    this.current = {}
    this.next = {}
    this.prev = {}
    this.menu = []
}

ManualByJs.prototype = {
    read: function(page){
        fetch(this.folderContent + '/' + page + '.html')
        .then(response => response.text())
        .then(data => {
            var div = document.getElementById('page') 
            div.innerHTML = ""
            div.insertAdjacentHTML("afterbegin", data) 
        })
        .catch(error => {
            alert('Can not get page content "'+ page + '"!')
            console.error('Error fetching the file  page', error);
        });
    },
    navigate: async function(hash){
        that = this
        for(var ind = 0; ind < that.menu.length; ind++)
        {
            item = that.menu[ind]
            console.log('navigate', item, hash)
            if(hash == item.slug)
            {   
                that.current = item
                await that.read(item.slug)
                var div = document.getElementById('page-nav')
                div.innerHTML = ""
                if(ind - 1 > -1)
                {
                    that.prev = that.menu[ind - 1] 
                    div.insertAdjacentHTML("afterbegin", 
                        '<a href="#'+that.prev.slug+'" class="">' +
                            '<span>Previous page</span>' +
                            that.prev.title +
                        '</a>');
                }
                if(ind + 1 < that.menu.length)
                {
                    that.next = that.menu[ind + 1]
                    div.insertAdjacentHTML("beforeend", 
                        '<a href="#'+that.next.slug+'" class="text-end">' +
                            '<span>Next page</span>' +
                            that.next.title +
                        '</a>');
                } 
                break;
            }
        }
    },
    init: async function(callable){
        that = this

        window.addEventListener('hashchange', function() {
            const hash = window.location.hash.substring(1); // Remove the '#' character
            that.navigate(hash);
        });
        
        fetch(this.folderContent + '/menu.json')
        .then(response => response.text())
        .then(data => {
            that.menu = JSON.parse(data)
            //console.log('getMenu', that.menu)
            if(typeof callable == 'function') callable()
            that.navigate(that.index)
        })
        .catch(error => {
            alert('Can not create menu!')
            console.error('Error fetching the file  menu', error);
        });
    },
    test: function()
    {
        console.log('test', this.menu)
    }
}